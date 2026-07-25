using BuergerbusAPI.Data;
using BuergerbusAPI.Endpoints;
using BuergerbusAPI.Models;
using BuergerbusAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Net;
using System.Net.Sockets;

/// <summary>
/// Einstiegspunkt der Anwendung.
/// Konfiguriert Services, Middleware, CORS, Swagger, registriert alle API-Endpunkte
/// und führt das initiale Datenbank-Seeding aus.
/// </summary>

var builder = WebApplication.CreateBuilder(args);

ValidateJwtConfiguration(builder);

var rawConnectionString = builder.Configuration.GetConnectionString("Default");
var connectionString = ExpandEnvPlaceholders(rawConnectionString);
var serverVersion = ResolveMySqlServerVersion();

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        serverVersion
    ));

builder.Services.AddScoped<IPasswordHasher<Benutzer>, PasswordHasher<Benutzer>>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient("Nominatim", client =>
{
    client.BaseAddress = new Uri("https://nominatim.openstreetmap.org/");
    // The endpoint owns the 10-second request budget so it can distinguish it
    // from a browser cancellation and the shorter TCP connect timeout.
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("BuergerbusDigital/1.0 (kontakt@buergerbus.info)");
    client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
    client.DefaultRequestVersion = HttpVersion.Version11;
    client.DefaultVersionPolicy = HttpVersionPolicy.RequestVersionExact;
})
.ConfigurePrimaryHttpMessageHandler(() =>
{
    var handler = new SocketsHttpHandler
    {
        ConnectTimeout = TimeSpan.FromSeconds(5),
        PooledConnectionLifetime = TimeSpan.FromMinutes(5),
        PooledConnectionIdleTimeout = TimeSpan.FromMinutes(2),
        AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
        UseProxy = false
    };

    // Restrict only Nominatim to IPv4. Socket.ConnectAsync resolves the host
    // itself and therefore tries the IPv4 DNS endpoint without custom lookup.
    handler.ConnectCallback = async (context, cancellationToken) =>
    {
        var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
        try
        {
            var endpoint = new DnsEndPoint(
                context.DnsEndPoint.Host,
                context.DnsEndPoint.Port,
                AddressFamily.InterNetwork);

            await socket.ConnectAsync(endpoint, cancellationToken);
            return new NetworkStream(socket, ownsSocket: true);
        }
        catch
        {
            socket.Dispose();
            throw;
        }
    };

    return handler;
});
builder.Services.AddSingleton(new EmailSettings
{
    SmtpHost = GetRequiredSetting(builder, "EMAIL_SMTP_HOST"),
    SmtpPort = GetRequiredIntSetting(builder, "EMAIL_SMTP_PORT"),
    Username = builder.Configuration["EMAIL_SMTP_USERNAME"] ?? string.Empty,
    Password = builder.Configuration["EMAIL_SMTP_PASSWORD"] ?? string.Empty,
    FromAddress = GetRequiredSetting(builder, "EMAIL_FROM_ADDRESS"),
    FromName = GetRequiredSetting(builder, "EMAIL_FROM_NAME"),
    UseSsl = GetRequiredBoolSetting(builder, "EMAIL_USE_SSL"),
    FrontendUrl = GetRequiredSetting(builder, "FRONTEND_URL")
});
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<TripEmailNotificationService>();
builder.Services.AddScoped<InitiativeDeletionService>();
builder.Services.AddScoped<ITemporaryParticipantCleanupService, TemporaryParticipantCleanupService>();
builder.Services.AddScoped<PageService>();
builder.Services.AddScoped<FooterService>();
builder.Services.AddHostedService<TemporaryParticipantCleanupBackgroundService>();
builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "JWT Authorization: Bearer {token}"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCors", policy =>
    {
        var allowedOriginsRaw = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
        if (!builder.Environment.IsDevelopment()
            && string.Equals(allowedOriginsRaw?.Trim(), "*", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "CORS_ALLOWED_ORIGINS='*' ist in Staging/Production nicht erlaubt."
            );
        }

        if (string.Equals(allowedOriginsRaw?.Trim(), "*", StringComparison.Ordinal))
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
            return;
        }

        if (builder.Environment.IsDevelopment() && string.IsNullOrWhiteSpace(allowedOriginsRaw))
        {
            policy
                .SetIsOriginAllowed(_ => true)
                .AllowAnyHeader()
                .AllowAnyMethod();
            return;
        }

        var allowedOrigins = (allowedOriginsRaw ?? "http://localhost:5173")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["JWT_ISSUER"],
            ValidAudience = builder.Configuration["JWT_AUDIENCE"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JWT_SECRET"]!)
            )
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

builder.Services.AddHostedService<FahrgastCleanupService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRouting();

app.UseCors("FrontendCors");

app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapAdminNotificationEndpoints();
app.MapPublicPagesEndpoints();
app.MapPublicFooterEndpoints();
app.MapAdminPagesEndpoints();
app.MapAdminFooterEndpoints();
app.MapRoleEndpoints();
app.MapInitiativeEndpoints();
app.MapFahrzeugServiceEndpoints();
app.MapFahrgastEndpoints();
app.MapFahrerEndpoints();
app.MapAddressEndpoints();

app.MapFahrtenEndpoints();
app.MapControllers(); 

try
{
    if (connectionString.Contains("${", StringComparison.Ordinal))
    {
        app.Logger.LogWarning(
            "SeedData wird übersprungen, da ConnectionString noch Platzhalter enthält: {ConnectionString}",
            connectionString
        );
    }
    else
    {
        await SeedData.InitializeAsync(app.Services);
    }
}
catch (SeedConfigurationException ex)
{
    app.Logger.LogError(ex, "Ungültige Seed-Konfiguration.");
    throw;
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Fehler beim Seeding des initialen Admin-Benutzers.");
} 

app.Run();

static void ValidateJwtConfiguration(WebApplicationBuilder builder)
{
    var secret = builder.Configuration["JWT_SECRET"];
    if (string.IsNullOrWhiteSpace(secret) || secret.Trim().Length < 32)
    {
        throw new InvalidOperationException("JWT_SECRET is missing or invalid.");
    }

    var issuer = builder.Configuration["JWT_ISSUER"];
    if (string.IsNullOrWhiteSpace(issuer))
    {
        throw new InvalidOperationException("JWT_ISSUER is missing or invalid.");
    }

    var audience = builder.Configuration["JWT_AUDIENCE"];
    if (string.IsNullOrWhiteSpace(audience))
    {
        throw new InvalidOperationException("JWT_AUDIENCE is missing or invalid.");
    }

    var expiresRaw = builder.Configuration["JWT_EXPIRES_MINUTES"];
    if (!int.TryParse(expiresRaw, out var minutes) || minutes <= 0)
    {
        throw new InvalidOperationException("JWT_EXPIRES_MINUTES is missing or invalid.");
    }
}

static string ExpandEnvPlaceholders(string? value)
{
    var input = value ?? string.Empty;

    // Replace ${VAR} placeholders with matching env var values (if present).
    var replaced = Regex.Replace(input, "\\$\\{(?<name>[A-Za-z_][A-Za-z0-9_]*)\\}", match =>
    {
        var name = match.Groups["name"].Value;
        var env = Environment.GetEnvironmentVariable(name);
        return string.IsNullOrEmpty(env) ? match.Value : env;
    });

    // Ensure DB_PORT placeholder doesn't break parsing.
    replaced = replaced.Replace("${DB_PORT}", "3306", StringComparison.Ordinal);

    // Ensure the 'port=' option is always numeric to avoid MySqlConnector format exceptions.
    replaced = Regex.Replace(replaced, "(?i)\\bport=(?<port>[^;]*)", match =>
    {
        var portText = match.Groups["port"].Value;
        return uint.TryParse(portText, out _) ? match.Value : "port=3306";
    });

    return replaced;
}

static ServerVersion ResolveMySqlServerVersion()
{
    // Pomelo expects strings like "11.0.0-mariadb" or "8.0.36-mysql".
    var configured = Environment.GetEnvironmentVariable("DB_SERVER_VERSION");
    if (!string.IsNullOrWhiteSpace(configured))
    {
        return ServerVersion.Parse(configured.Trim());
    }

    return ServerVersion.Parse("11.0.0-mariadb");
}

static string GetRequiredSetting(WebApplicationBuilder builder, string key)
{
    var value = builder.Configuration[key] ?? Environment.GetEnvironmentVariable(key);
    if (string.IsNullOrWhiteSpace(value))
    {
        throw new InvalidOperationException($"{key} is missing or invalid.");
    }

    return value.Trim();
}

static int GetRequiredIntSetting(WebApplicationBuilder builder, string key)
{
    var value = GetRequiredSetting(builder, key);
    if (!int.TryParse(value, out var parsed) || parsed <= 0)
    {
        throw new InvalidOperationException($"{key} is missing or invalid.");
    }

    return parsed;
}

static bool GetRequiredBoolSetting(WebApplicationBuilder builder, string key)
{
    var value = GetRequiredSetting(builder, key);
    if (!bool.TryParse(value, out var parsed))
    {
        throw new InvalidOperationException($"{key} is missing or invalid.");
    }

    return parsed;
}

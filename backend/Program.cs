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

/// <summary>
/// Einstiegspunkt der Anwendung.
/// Konfiguriert Services, Middleware, CORS, Swagger, registriert alle API-Endpunkte
/// und führt das initiale Datenbank-Seeding aus.
/// </summary>

var builder = WebApplication.CreateBuilder(args);

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
app.MapRoleEndpoints();
app.MapInitiativeEndpoints();
app.MapFahrzeugServiceEndpoints();
app.MapFahrgastEndpoints();

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
catch (Exception ex)
{
    app.Logger.LogError(ex, "Fehler beim Seeding des initialen Admin-Benutzers.");
}

app.Run();

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

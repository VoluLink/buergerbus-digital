using System.Linq;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BuergerbusAPI.Data;
using BuergerbusAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("Default"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("Default"))
    ));

builder.Services.AddScoped<IPasswordHasher<Benutzer>, PasswordHasher<Benutzer>>();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

app.UseAuthorization();

app.MapPost("/api/v1/auth/login", async (
    LoginRequest request,
    AppDbContext db,
    IPasswordHasher<Benutzer> passwordHasher
) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest("E-Mail und Passwort sind erforderlich.");
    }

    var user = await db.Benutzer.FirstOrDefaultAsync(u => u.Email == request.Email);

    if (user is null)
    {
        return Results.Text(
            "Ungültige Zugangsdaten.",
            statusCode: StatusCodes.Status401Unauthorized
        );
    }

    var passwordResult = passwordHasher.VerifyHashedPassword(user, user.PasswortHash, request.Password);

    if (passwordResult == PasswordVerificationResult.Failed)
    {
        return Results.Text(
            "Ungültige Zugangsdaten.",
            statusCode: StatusCodes.Status401Unauthorized
        );
    }

    if (passwordResult == PasswordVerificationResult.SuccessRehashNeeded)
    {
        user.PasswortHash = passwordHasher.HashPassword(user, request.Password);
        await db.SaveChangesAsync();
    }

    return Results.Ok(new
    {
        success = true,
        message = "Login erfolgreich.",
        email = request.Email,
    });
});

app.MapControllers();

try
{
    await SeedAdminUserAsync(app.Services);
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Fehler beim Seeding des initialen Admin-Benutzers.");
}

app.Run();

static async Task SeedAdminUserAsync(IServiceProvider services)
{
    using var scope = services.CreateScope();

    var logger = scope.ServiceProvider
        .GetRequiredService<ILoggerFactory>()
        .CreateLogger("SeedAdminUser");

    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Benutzer>>();

    var maxAttempts = 10;
    if (int.TryParse(Environment.GetEnvironmentVariable("DB_SEED_MAX_ATTEMPTS"), out var configuredAttempts)
        && configuredAttempts > 0)
    {
        maxAttempts = configuredAttempts;
    }

    var delayMs = 1000;
    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            await db.Database.MigrateAsync();
            break;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            logger.LogWarning(
                ex,
                "DB noch nicht bereit (Attempt {Attempt}/{MaxAttempts}). Retry in {DelayMs}ms...",
                attempt,
                maxAttempts,
                delayMs
            );

            await Task.Delay(delayMs);
            delayMs = Math.Min(delayMs * 2, 10_000);
        }
    }

    var email = Environment.GetEnvironmentVariable("SEED_ADMIN_EMAIL")
                ?? "admin@example.com";

    var password = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD")
                   ?? "Admin123!";

    var initiativeName = Environment.GetEnvironmentVariable("SEED_INITIATIVE_NAME")
                         ?? "Default";

    const string roleName = "admin";

    var adminRole = await db.Rollen.FirstOrDefaultAsync(r => r.Rollenname == roleName);
    if (adminRole is null)
    {
        adminRole = new Rollen { Rollenname = roleName };
        db.Rollen.Add(adminRole);
        await db.SaveChangesAsync();

        logger.LogInformation("Seed-Rolle {RoleName} wurde erstellt.", roleName);
    }

    var user = await db.Benutzer.FirstOrDefaultAsync(u => u.Email == email);

    var initiative = await db.Initiativen.FirstOrDefaultAsync();
    if (initiative is null)
    {
        initiative = new Initiativen
        {
            Name = initiativeName,
            AngelegtAm = DateTime.UtcNow,
        };

        db.Initiativen.Add(initiative);
        await db.SaveChangesAsync();
    }

    if (user is null)
    {
        user = new Benutzer
        {
            Nutzername = email,
            Email = email,
            InitiativeId = initiative.Id,
            PasswortHash = "",
        };

        user.PasswortHash = passwordHasher.HashPassword(user, password);

        db.Benutzer.Add(user);
        await db.SaveChangesAsync();

        logger.LogInformation(
            "Seed-Admin-Benutzer {Email} wurde erstellt (InitiativeId={InitiativeId}).",
            email,
            user.InitiativeId
        );
    }

    var hasAdminRole = await db.BenutzerRollen.AnyAsync(br =>
        br.BenutzerId == user.Id && br.RolleId == adminRole.Id);

    if (!hasAdminRole)
    {
        db.BenutzerRollen.Add(new BenutzerRolle
        {
            BenutzerId = user.Id,
            RolleId = adminRole.Id,
        });

        await db.SaveChangesAsync();

        logger.LogInformation(
            "Seed: Benutzer {Email} wurde Rolle {RoleName} zugeordnet.",
            user.Email,
            roleName
        );
    }
}

record LoginRequest(string Email, string Password);

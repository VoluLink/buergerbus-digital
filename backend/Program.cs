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
        return Results.BadRequest("E-Mail oder Benutzername und Passwort sind erforderlich.");
    }

    var identifier = request.Email.Trim();
    var normalizedIdentifier = identifier.ToLowerInvariant();

    var user = await db.Benutzer
        .Include(u => u.Initiative)
        .Include(u => u.BenutzerRollen)
            .ThenInclude(br => br.Rolle)
        .Include(u => u.Fahrer)
        .FirstOrDefaultAsync(u =>
            u.Email.ToLower() == normalizedIdentifier
            || u.Nutzername.ToLower() == normalizedIdentifier);

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

    return Results.Ok(new LoginResponseDto(
        true,
        "Login erfolgreich.",
        CreateUserProfile(user))
    );
});

app.MapGet("/api/v1/roles", async (AppDbContext db) =>
{
    var roles = await db.Rollen
        .AsNoTracking()
        .OrderBy(r => r.Rollenname)
        .Select(r => new RoleDto(r.Id, r.Rollenname))
        .ToListAsync();

    return Results.Ok(roles);
});

app.MapGet("/api/v1/users/me", async (
    int? userId,
    string? email,
    AppDbContext db
) =>
{
    if (userId is null && string.IsNullOrWhiteSpace(email))
    {
        return Results.BadRequest("userId oder email ist erforderlich.");
    }

    var normalizedEmail = email?.Trim().ToLowerInvariant();

    var user = await db.Benutzer
        .Include(u => u.Initiative)
        .Include(u => u.BenutzerRollen)
            .ThenInclude(br => br.Rolle)
        .Include(u => u.Fahrer)
        .FirstOrDefaultAsync(u =>
            (userId.HasValue && u.Id == userId.Value)
            || (!string.IsNullOrWhiteSpace(normalizedEmail) && u.Email.ToLower() == normalizedEmail));

    if (user is null)
    {
        return Results.NotFound("Benutzer wurde nicht gefunden.");
    }

    return Results.Ok(CreateUserProfile(user));
});

app.MapGet("/api/v1/users", async (AppDbContext db) =>
{
    var users = await db.Benutzer
        .AsNoTracking()
        .Include(u => u.Initiative)
        .Include(u => u.BenutzerRollen)
            .ThenInclude(br => br.Rolle)
        .Include(u => u.Fahrer)
        .Select(u => new UserSummaryDto(
            u.Id,
            u.Nutzername,
            u.Email,
            u.Initiative == null ? null : new InitiativeDto(u.Initiative.Id, u.Initiative.Name),
            u.BenutzerRollen
                .Select(br => br.Rolle.Rollenname)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct()
                .ToList(),
            u.Fahrer == null ? null : u.Fahrer.Id,
            u.Fahrer == null || u.Fahrer.Aktiv
        ))
        .ToListAsync();

    return Results.Ok(users);
});

app.MapGet("/api/v1/users/{id:int}", async (int id, AppDbContext db) =>
{
    var user = await db.Benutzer
        .Include(u => u.Initiative)
        .Include(u => u.BenutzerRollen)
            .ThenInclude(br => br.Rolle)
        .Include(u => u.Fahrer)
        .FirstOrDefaultAsync(u => u.Id == id);

    if (user is null)
    {
        return Results.NotFound("Benutzer wurde nicht gefunden.");
    }

    return Results.Ok(CreateUserProfile(user));
});

app.MapGet("/api/v1/users/{id:int}/profile", async (int id, AppDbContext db) =>
{
    var user = await db.Benutzer
        .Include(u => u.Initiative)
        .Include(u => u.BenutzerRollen)
            .ThenInclude(br => br.Rolle)
        .Include(u => u.Fahrer)
        .FirstOrDefaultAsync(u => u.Id == id);

    if (user is null)
    {
        return Results.NotFound("Benutzer wurde nicht gefunden.");
    }

    return Results.Ok(CreateUserProfile(user));
});

app.MapGet("/api/v1/users/{id:int}/roles", async (int id, AppDbContext db) =>
{
    var user = await db.Benutzer
        .Include(u => u.BenutzerRollen)
            .ThenInclude(br => br.Rolle)
        .FirstOrDefaultAsync(u => u.Id == id);

    if (user is null)
    {
        return Results.NotFound("Benutzer wurde nicht gefunden.");
    }

    var roles = user.BenutzerRollen
        .Select(br => br.Rolle.Rollenname)
        .Where(name => !string.IsNullOrWhiteSpace(name))
        .Distinct()
        .ToList();

    return Results.Ok(new UserRolesDto(id, roles));
});

app.MapPut("/api/v1/users/{id:int}/roles", async (
    int id,
    UpdateRolesRequest request,
    AppDbContext db
) =>
{
    var user = await db.Benutzer
        .Include(u => u.BenutzerRollen)
            .ThenInclude(br => br.Rolle)
        .FirstOrDefaultAsync(u => u.Id == id);

    if (user is null)
    {
        return Results.NotFound("Benutzer wurde nicht gefunden.");
    }

    if (request.Roles == null)
    {
        return Results.BadRequest("Rollenliste fehlt.");
    }

    var requestedRoles = request.Roles
        .Select(role => role?.Trim())
        .Where(role => !string.IsNullOrWhiteSpace(role))
        .ToList();

    var normalizedRoles = requestedRoles
        .Select(role => role!.ToLowerInvariant())
        .Distinct()
        .ToList();

    var rolesByName = await db.Rollen
        .Where(r => normalizedRoles.Contains(r.Rollenname.ToLower()))
        .ToDictionaryAsync(r => r.Rollenname.ToLower(), r => r);

    foreach (var roleName in requestedRoles)
    {
        var normalizedRole = roleName!.ToLowerInvariant();
        if (rolesByName.ContainsKey(normalizedRole))
        {
            continue;
        }

        var newRole = new Rollen { Rollenname = roleName };
        db.Rollen.Add(newRole);
        rolesByName[normalizedRole] = newRole;
    }

    await db.SaveChangesAsync();

    user.BenutzerRollen.RemoveAll(br =>
        !normalizedRoles.Contains(br.Rolle.Rollenname.ToLowerInvariant()));

    foreach (var roleName in normalizedRoles)
    {
        var role = rolesByName[roleName];
        if (user.BenutzerRollen.Any(br => br.RolleId == role.Id))
        {
            continue;
        }

        user.BenutzerRollen.Add(new BenutzerRolle
        {
            BenutzerId = user.Id,
            RolleId = role.Id,
        });
    }

    await db.SaveChangesAsync();

    return Results.Ok(new UserRolesDto(
        user.Id,
        user.BenutzerRollen
            .Select(br => br.Rolle.Rollenname)
            .Distinct()
            .ToList()));
});

app.MapGet("/api/v1/users/{id:int}/initiative", async (int id, AppDbContext db) =>
{
    var user = await db.Benutzer
        .Include(u => u.Initiative)
        .FirstOrDefaultAsync(u => u.Id == id);

    if (user is null)
    {
        return Results.NotFound("Benutzer wurde nicht gefunden.");
    }

    if (user.Initiative == null)
    {
        return Results.Ok(null);
    }

    return Results.Ok(new InitiativeDto(user.Initiative.Id, user.Initiative.Name));
});

app.MapPut("/api/v1/users/{id:int}/initiative", async (
    int id,
    UpdateInitiativeRequest request,
    AppDbContext db
) =>
{
    var user = await db.Benutzer.FirstOrDefaultAsync(u => u.Id == id);
    if (user is null)
    {
        return Results.NotFound("Benutzer wurde nicht gefunden.");
    }

    var initiative = await db.Initiativen.FirstOrDefaultAsync(i => i.Id == request.InitiativeId);
    if (initiative is null)
    {
        return Results.NotFound("Initiative wurde nicht gefunden.");
    }

    user.InitiativeId = initiative.Id;
    await db.SaveChangesAsync();

    return Results.Ok(new InitiativeDto(initiative.Id, initiative.Name));
});

app.MapGet("/api/v1/initiatives", async (AppDbContext db) =>
{
    var initiatives = await db.Initiativen
        .AsNoTracking()
        .OrderBy(i => i.Name)
        .Select(i => new InitiativeDto(i.Id, i.Name))
        .ToListAsync();

    return Results.Ok(initiatives);
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

    var requiredRoleNames = new[] { "Admin", "Disponent", "Fahrer" };
    var existingRoles = await db.Rollen.ToListAsync();

    foreach (var roleName in requiredRoleNames)
    {
        if (existingRoles.Any(r => string.Equals(r.Rollenname, roleName, StringComparison.OrdinalIgnoreCase)))
        {
            continue;
        }

        var newRole = new Rollen { Rollenname = roleName };
        db.Rollen.Add(newRole);
        existingRoles.Add(newRole);

        logger.LogInformation("Seed-Rolle {RoleName} wurde erstellt.", roleName);
    }

    if (db.ChangeTracker.HasChanges())
    {
        await db.SaveChangesAsync();
    }

    var adminRole = existingRoles.FirstOrDefault(r =>
        string.Equals(r.Rollenname, "Admin", StringComparison.OrdinalIgnoreCase));

    if (adminRole is null)
    {
        adminRole = new Rollen { Rollenname = "Admin" };
        db.Rollen.Add(adminRole);
        await db.SaveChangesAsync();

        logger.LogInformation("Seed-Rolle {RoleName} wurde erstellt.", adminRole.Rollenname);
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
            adminRole.Rollenname
        );
    }
}

static UserProfileDto CreateUserProfile(Benutzer user)
{
    var roles = user.BenutzerRollen
        .Select(br => br.Rolle.Rollenname)
        .Where(name => !string.IsNullOrWhiteSpace(name))
        .Distinct()
        .ToList();

    FahrerProfileDto? fahrer = null;
    if (user.Fahrer != null)
    {
        fahrer = new FahrerProfileDto(
            user.Fahrer.Id,
            user.Fahrer.Vorname,
            user.Fahrer.Nachname,
            user.Fahrer.Adresse,
            user.Fahrer.Telefonnummer,
            user.Fahrer.Fuehrerscheinklasse,
            user.Fahrer.LetzteG25,
            user.Fahrer.NaechsteG25,
            user.Fahrer.Bemerkung,
            user.Fahrer.Aktiv
        );
    }

    var initiative = user.Initiative == null
        ? null
        : new InitiativeDto(user.Initiative.Id, user.Initiative.Name);

    return new UserProfileDto(
        user.Id,
        user.Nutzername,
        user.Email,
        initiative,
        roles,
        fahrer
    );
}

record LoginRequest(string Email, string Password);
record LoginResponseDto(bool Success, string Message, UserProfileDto User);
record RoleDto(int Id, string Name);
record UserSummaryDto(
    int Id,
    string Username,
    string Email,
    InitiativeDto? Initiative,
    List<string> Roles,
    int? FahrerId,
    bool IsActive
);
record UserProfileDto(
    int Id,
    string Username,
    string Email,
    InitiativeDto? Initiative,
    List<string> Roles,
    FahrerProfileDto? Fahrer
);
record UserRolesDto(int UserId, List<string> Roles);
record InitiativeDto(int Id, string Name);
record FahrerProfileDto(
    int Id,
    string Vorname,
    string Nachname,
    string Adresse,
    string? Telefonnummer,
    string Fuehrerscheinklasse,
    DateTime LetzteG25,
    DateTime? NaechsteG25,
    string? Bemerkung,
    bool Aktiv
);
record UpdateRolesRequest(List<string> Roles);
record UpdateInitiativeRequest(int InitiativeId);

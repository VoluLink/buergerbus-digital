using BuergerbusAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
/// <summary>
/// Initialisiert die Datenbank beim Anwendungsstart.
/// Führt Migrationen aus und erstellt Standarddaten wie Rollen,
/// Initiativen und den initialen Administrator.
/// </summary>
namespace BuergerbusAPI.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services)
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

        var requiredRoleNames = new[] { "Admin", "Disponent", "Fahrer", "Gast" };
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
                Aktiv = true,
                AngelegtAm = DateTime.UtcNow,
                AktiveRolle = adminRole.Rollenname
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
}

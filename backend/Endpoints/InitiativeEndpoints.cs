using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Enthält API-Endpunkte zum Abrufen und Aktualisieren
/// von Initiativen und Benutzer-Initiativen.
/// </summary>
namespace BuergerbusAPI.Endpoints;

public static class InitiativeEndpoints
{
    public static IEndpointRouteBuilder MapInitiativeEndpoints(this IEndpointRouteBuilder app)
    {
        static async Task<InitiativeDeletePreviewDto?> BuildDeletePreview(int id, AppDbContext db)
        {
            var initiative = await db.Initiativen
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == id);

            if (initiative is null)
            {
                return null;
            }

            var isDefault = string.Equals(initiative.Name, "Default", StringComparison.OrdinalIgnoreCase);
            // NOTE: DbContext is not thread-safe. Do NOT run EF queries concurrently on the same context.
            var users = await db.Benutzer.AsNoTracking().CountAsync(b => b.InitiativeId == id);
            var vehicles = await db.Fahrzeuge.AsNoTracking().CountAsync(f => f.InitiativeId == id);
            var maintenanceRecords = await db.Wartungen.AsNoTracking().CountAsync(w => w.InitiativeId == id);
            var damageReports = await db.Schaeden.AsNoTracking().CountAsync(s => s.InitiativeId == id);
            var rides = await db.Fahrten.AsNoTracking().CountAsync(f => f.InitiativeId == id);
            var passengers = await db.Fahrgaeste.AsNoTracking().CountAsync(f => f.InitiativeId == id);
            var rideSegments = await db.Fahrten.AsNoTracking()
                .Where(f => f.InitiativeId == id)
                .SelectMany(f => f.Teilstrecken)
                .CountAsync();
            var notifications = await db.Benachrichtigungen.AsNoTracking().CountAsync(b => b.InitiativeId == id);
            var deletionDeadlines = await db.Loeschfristen.AsNoTracking().CountAsync(l => l.InitiativeId == id);

            // Assignments (no InitiativeId on the join table) -> derived via Fahrzeug.
            var driverVehicleAssignments = await db.FahrerFahrzeuge
                .AsNoTracking()
                .CountAsync(ff => ff.Fahrzeug.InitiativeId == id);

            var affected = new InitiativeDeletePreviewAffectedDto(
                users,
                vehicles,
                maintenanceRecords,
                damageReports,
                rides,
                passengers,
                rideSegments,
                notifications,
                deletionDeadlines,
                driverVehicleAssignments
            );

            var canDelete = true;
            string? reason = null;

            var hasAnyDependencies =
                affected.Users > 0 ||
                affected.Vehicles > 0 ||
                affected.MaintenanceRecords > 0 ||
                affected.DamageReports > 0 ||
                affected.Rides > 0 ||
                affected.Passengers > 0 ||
                affected.RideSegments > 0 ||
                affected.Notifications > 0 ||
                affected.DeletionDeadlines > 0 ||
                affected.DriverVehicleAssignments > 0;

            if (isDefault)
            {
                canDelete = false;
                reason = "Die Standard-Initiative kann nicht gelöscht werden.";
            }
            else if (hasAnyDependencies)
            {
                canDelete = false;
                reason = "Die Initiative kann nicht gelöscht werden, solange noch abhängige Daten existieren.";
            }

            return new InitiativeDeletePreviewDto(
                initiative.Id,
                initiative.Name,
                canDelete,
                isDefault,
                reason,
                affected
            );
        }

        static async Task<IResult> GetInitiativenDetails(AppDbContext db)
        {
            var initiatives = await db.Initiativen
                .AsNoTracking()
                .OrderBy(i => i.Id)
                .Select(i => new InitiativeDetailsDto(
                    i.Id,
                    i.Name,
                    i.Beschreibung,
                    i.AngelegtAm,
                    i.GeaendertAm
                ))
                .ToListAsync();

            return Results.Ok(initiatives);
        }

        static async Task<IResult> CreateInitiative(CreateInitiativeRequest request, AppDbContext db)
        {
            var name = (request.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return Results.BadRequest("Name ist erforderlich.");
            }

            var nameExists = await db.Initiativen.AnyAsync(i => i.Name.ToLower() == name.ToLower());
            if (nameExists)
            {
                return Results.BadRequest("Eine Initiative mit diesem Namen existiert bereits.");
            }

            var beschreibung = string.IsNullOrWhiteSpace(request.Beschreibung)
                ? null
                : request.Beschreibung!.Trim();

            var entity = new Initiativen
            {
                Name = name,
                Beschreibung = beschreibung,
                AngelegtAm = DateTime.UtcNow,
                GeaendertAm = null,
            };

            db.Initiativen.Add(entity);
            await db.SaveChangesAsync();

            var dto = new InitiativeDetailsDto(
                entity.Id,
                entity.Name,
                entity.Beschreibung,
                entity.AngelegtAm,
                entity.GeaendertAm
            );

            return Results.Created($"/api/v1/initiativen/{entity.Id}", dto);
        }

        static async Task<IResult> UpdateInitiative(int id, UpdateInitiativeDetailsRequest request, AppDbContext db)
        {
            var entity = await db.Initiativen.FirstOrDefaultAsync(i => i.Id == id);
            if (entity is null)
            {
                return Results.NotFound("Initiative wurde nicht gefunden.");
            }

            var name = (request.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return Results.BadRequest("Name ist erforderlich.");
            }

            var nameExists = await db.Initiativen.AnyAsync(i => i.Id != id && i.Name.ToLower() == name.ToLower());
            if (nameExists)
            {
                return Results.BadRequest("Eine Initiative mit diesem Namen existiert bereits.");
            }

            var beschreibung = string.IsNullOrWhiteSpace(request.Beschreibung)
                ? null
                : request.Beschreibung!.Trim();

            entity.Name = name;
            entity.Beschreibung = beschreibung;
            entity.GeaendertAm = DateTime.UtcNow;

            await db.SaveChangesAsync();

            return Results.Ok(new InitiativeDetailsDto(
                entity.Id,
                entity.Name,
                entity.Beschreibung,
                entity.AngelegtAm,
                entity.GeaendertAm
            ));
        }

        static async Task<IResult> DeleteInitiative(int id, AppDbContext db)
        {
            var preview = await BuildDeletePreview(id, db);
            if (preview is null)
            {
                return Results.NotFound("Initiative wurde nicht gefunden.");
            }

            if (!preview.CanDelete)
            {
                return Results.Conflict(preview.Reason ?? "Die Initiative kann nicht gelöscht werden.");
            }

            try
            {
                var entity = await db.Initiativen.FindAsync(id);
                if (entity is null)
                {
                    return Results.NotFound("Initiative wurde nicht gefunden.");
                }

                db.Initiativen.Remove(entity);
                await db.SaveChangesAsync();

                return Results.NoContent();
            }
            catch (DbUpdateException)
            {
                return Results.Conflict("Die Initiative kann nicht gelöscht werden, da noch abhängige Daten existieren.");
            }
            catch (Exception)
            {
                return Results.Problem(
                    detail: "Beim Löschen der Initiative ist ein Fehler aufgetreten.",
                    statusCode: StatusCodes.Status500InternalServerError
                );
            }
        }

        static async Task<IResult> GetDeletePreview(int id, AppDbContext db)
        {
            var preview = await BuildDeletePreview(id, db);
            if (preview is null)
            {
                return Results.NotFound("Initiative wurde nicht gefunden.");
            }

            return Results.Ok(preview);
        }

        app.MapGet("/api/v1/initiativen", GetInitiativenDetails).RequireAuthorization("AdminOnly");
        app.MapPost("/api/v1/initiativen", CreateInitiative).RequireAuthorization("AdminOnly");
        app.MapGet("/api/v1/initiativen/{id:int}/delete-preview", GetDeletePreview).RequireAuthorization("AdminOnly");
        app.MapPut("/api/v1/initiativen/{id:int}", UpdateInitiative).RequireAuthorization("AdminOnly");
        app.MapDelete("/api/v1/initiativen/{id:int}", DeleteInitiative).RequireAuthorization("AdminOnly");

        // Aliases (unversioned, english) as requested in the task description.
        app.MapGet("/api/initiatives", GetInitiativenDetails).RequireAuthorization("AdminOnly");
        app.MapPost("/api/initiatives", CreateInitiative).RequireAuthorization("AdminOnly");
        app.MapGet("/api/initiatives/{id:int}/delete-preview", GetDeletePreview).RequireAuthorization("AdminOnly");
        app.MapPut("/api/initiatives/{id:int}", UpdateInitiative).RequireAuthorization("AdminOnly");
        app.MapDelete("/api/initiatives/{id:int}", DeleteInitiative).RequireAuthorization("AdminOnly");

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
        })
        .RequireAuthorization("AdminOnly");

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
        })
        .RequireAuthorization("AdminOnly");

        app.MapGet("/api/v1/initiatives", async (AppDbContext db) =>
        {
            var initiatives = await db.Initiativen
                .AsNoTracking()
                .OrderBy(i => i.Name)
                .Select(i => new InitiativeDto(i.Id, i.Name))
                .ToListAsync();

            return Results.Ok(initiatives);
        })
        .RequireAuthorization("AdminOnly");

        return app;
    }
}

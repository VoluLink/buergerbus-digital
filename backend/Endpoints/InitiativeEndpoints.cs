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
            var defaultInitiative = await db.Initiativen
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Name.ToLower() == "default");

            var usersTask = db.Benutzer.AsNoTracking().CountAsync(b => b.InitiativeId == id);
            var vehiclesTask = db.Fahrzeuge.AsNoTracking().CountAsync(f => f.InitiativeId == id);
            var maintenanceTask = db.Wartungen.AsNoTracking().CountAsync(w => w.InitiativeId == id);
            var damageTask = db.Schaeden.AsNoTracking().CountAsync(s => s.InitiativeId == id);
            var ridesTask = db.Fahrten.AsNoTracking().CountAsync(f => f.InitiativeId == id);
            var passengersTask = db.Fahrgaeste.AsNoTracking().CountAsync(f => f.InitiativeId == id);
            var segmentsTask = db.Teilstrecken.AsNoTracking().CountAsync(t => t.InitiativeId == id);
            var notificationsTask = db.Benachrichtigungen.AsNoTracking().CountAsync(b => b.InitiativeId == id);
            var deadlinesTask = db.Loeschfristen.AsNoTracking().CountAsync(l => l.InitiativeId == id);

            // Assignments (no InitiativeId on the join table) -> derived via Fahrzeug.
            var driverVehicleAssignmentsTask = db.FahrerFahrzeuge
                .AsNoTracking()
                .CountAsync(ff => ff.Fahrzeug.InitiativeId == id);

            await Task.WhenAll(
                usersTask,
                vehiclesTask,
                maintenanceTask,
                damageTask,
                ridesTask,
                passengersTask,
                segmentsTask,
                notificationsTask,
                deadlinesTask,
                driverVehicleAssignmentsTask
            );

            var canDelete = true;
            string? reason = null;

            if (isDefault)
            {
                canDelete = false;
                reason = "Die Standard-Initiative kann nicht gelöscht werden.";
            }
            else if (defaultInitiative is null && usersTask.Result > 0)
            {
                canDelete = false;
                reason = "Die Initiative kann nicht gelöscht werden, da keine Default-Initiative zum Umhängen der Benutzer existiert.";
            }

            return new InitiativeDeletePreviewDto(
                initiative.Id,
                initiative.Name,
                canDelete,
                isDefault,
                reason,
                new InitiativeDeletePreviewAffectedDto(
                    usersTask.Result,
                    vehiclesTask.Result,
                    maintenanceTask.Result,
                    damageTask.Result,
                    ridesTask.Result,
                    passengersTask.Result,
                    segmentsTask.Result,
                    notificationsTask.Result,
                    deadlinesTask.Result,
                    driverVehicleAssignmentsTask.Result
                )
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
                return Results.BadRequest(preview.Reason ?? "Die Initiative kann nicht gelöscht werden.");
            }

            await using var tx = await db.Database.BeginTransactionAsync();

            try
            {
                // Ensure Default initiative exists for user reassignment.
                var defaultInitiative = await db.Initiativen
                    .FirstOrDefaultAsync(i => i.Name.ToLower() == "default");

                if (defaultInitiative is null && preview.Affected.Users > 0)
                {
                    return Results.BadRequest(
                        "Die Initiative kann nicht gelöscht werden, da keine Default-Initiative zum Umhängen der Benutzer existiert."
                    );
                }

                // Reassign users (never cascade-delete user accounts).
                if (preview.Affected.Users > 0)
                {
                    var usersToReassign = await db.Benutzer
                        .Where(b => b.InitiativeId == id)
                        .ToListAsync();

                    foreach (var user in usersToReassign)
                    {
                        user.InitiativeId = defaultInitiative!.Id;
                    }

                    // Persist reassignment early to avoid FK/cascade issues when deleting the initiative.
                    await db.SaveChangesAsync();
                }

                // Delete initiative-owned data (children first).
                if (preview.Affected.RideSegments > 0)
                {
                    await db.Teilstrecken.Where(t => t.InitiativeId == id).ExecuteDeleteAsync();
                }

                if (preview.Affected.DeletionDeadlines > 0)
                {
                    await db.Loeschfristen.Where(l => l.InitiativeId == id).ExecuteDeleteAsync();
                }

                if (preview.Affected.Rides > 0)
                {
                    await db.Fahrten.Where(f => f.InitiativeId == id).ExecuteDeleteAsync();
                }

                if (preview.Affected.MaintenanceRecords > 0)
                {
                    await db.Wartungen.Where(w => w.InitiativeId == id).ExecuteDeleteAsync();
                }

                if (preview.Affected.DamageReports > 0)
                {
                    await db.Schaeden.Where(s => s.InitiativeId == id).ExecuteDeleteAsync();
                }

                if (preview.Affected.Notifications > 0)
                {
                    await db.Benachrichtigungen.Where(b => b.InitiativeId == id).ExecuteDeleteAsync();
                }

                // Driver-vehicle assignments depend on vehicles.
                if (preview.Affected.DriverVehicleAssignments > 0)
                {
                    var vehicleIds = db.Fahrzeuge
                        .Where(v => v.InitiativeId == id)
                        .Select(v => v.Id);

                    await db.FahrerFahrzeuge
                        .Where(ff => vehicleIds.Contains(ff.FahrzeugId))
                        .ExecuteDeleteAsync();
                }

                if (preview.Affected.Vehicles > 0)
                {
                    await db.Fahrzeuge.Where(v => v.InitiativeId == id).ExecuteDeleteAsync();
                }

                if (preview.Affected.Passengers > 0)
                {
                    await db.Fahrgaeste.Where(f => f.InitiativeId == id).ExecuteDeleteAsync();
                }

                // Finally delete the initiative itself.
                var entity = await db.Initiativen.FirstOrDefaultAsync(i => i.Id == id);
                if (entity is null)
                {
                    await tx.RollbackAsync();
                    return Results.NotFound("Initiative wurde nicht gefunden.");
                }

                db.Initiativen.Remove(entity);
                await db.SaveChangesAsync();
                await tx.CommitAsync();

                return Results.NoContent();
            }
            catch (Exception)
            {
                await tx.RollbackAsync();
                return Results.Problem(
                    detail: "Beim Löschen der abhängigen Daten ist ein Fehler aufgetreten.",
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

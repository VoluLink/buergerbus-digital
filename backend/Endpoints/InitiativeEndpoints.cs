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
            var entity = await db.Initiativen.FirstOrDefaultAsync(i => i.Id == id);
            if (entity is null)
            {
                return Results.NotFound("Initiative wurde nicht gefunden.");
            }

            if (string.Equals(entity.Name, "Default", StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest("Die Standard-Initiative kann nicht gelöscht werden.");
            }

            db.Initiativen.Remove(entity);

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Results.Conflict("Initiative kann nicht gelöscht werden, da sie noch verwendet wird.");
            }

            return Results.NoContent();
        }

        app.MapGet("/api/v1/initiativen", GetInitiativenDetails);
        app.MapPost("/api/v1/initiativen", CreateInitiative);
        app.MapPut("/api/v1/initiativen/{id:int}", UpdateInitiative);
        app.MapDelete("/api/v1/initiativen/{id:int}", DeleteInitiative);

        // Aliases (unversioned, english) as requested in the task description.
        app.MapGet("/api/initiatives", GetInitiativenDetails);
        app.MapPost("/api/initiatives", CreateInitiative);
        app.MapPut("/api/initiatives/{id:int}", UpdateInitiative);
        app.MapDelete("/api/initiatives/{id:int}", DeleteInitiative);

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

        return app;
    }
}

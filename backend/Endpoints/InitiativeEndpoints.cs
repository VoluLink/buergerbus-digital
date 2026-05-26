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
        app.MapGet("/api/v1/initiativen", async (AppDbContext db) =>
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
        });

        app.MapPost("/api/v1/initiativen", async (CreateInitiativeRequest request, AppDbContext db) =>
        {
            var name = (request.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return Results.BadRequest("Name ist erforderlich.");
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

        return app;
    }
}

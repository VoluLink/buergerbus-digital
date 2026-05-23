using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Mappers;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Enthält API-Endpunkte für Fahrgäste.
/// </summary>
namespace BuergerbusAPI.Endpoints;

public static class FahrgastEndpoints
{
    public static IEndpointRouteBuilder MapFahrgastEndpoints(this IEndpointRouteBuilder app)
    {
        // Alle Fahrgäste abrufen
        app.MapGet("/api/v1/fahrgaeste", async (AppDbContext db) =>
        {
            var fahrgaeste = await db.Fahrgaeste
                .Include(f => f.Initiative)
                .AsNoTracking()
                .OrderBy(f => f.Nachname)
                .ThenBy(f => f.Vorname)
                .ToListAsync();

            var result = fahrgaeste
                .Select(FahrgastMapper.CreateFahrgast);

            return Results.Ok(result);
        });

        // Einzelnen Fahrgast abrufen
        app.MapGet("/api/v1/fahrgaeste/{id:int}", async (
            int id,
            AppDbContext db
        ) =>
        {
            var fahrgast = await db.Fahrgaeste
                .Include(f => f.Initiative)
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fahrgast is null)
            {
                return Results.NotFound("Fahrgast wurde nicht gefunden.");
            }

            return Results.Ok(
                FahrgastMapper.CreateFahrgast(fahrgast)
            );
        });

        // Fahrgast erstellen
        app.MapPost("/api/v1/fahrgaeste", async (
            CreateFahrgastDto request,
            AppDbContext db
        ) =>
        {
            var initiative = await db.Initiativen
                .FirstOrDefaultAsync(i => i.Id == request.InitiativeId);

            if (initiative is null)
            {
                return Results.NotFound("Initiative wurde nicht gefunden.");
            }

            var fahrgast = new Fahrgast
            {
                Vorname = request.Vorname,
                Nachname = request.Nachname,
                Adresse = request.Adresse,
                Email = request.Email,
                Telefonnummer = request.Telefonnummer,
                Bemerkung = request.Bemerkung,
                AngelegtAm = DateTime.UtcNow,
                Aktiv = true,
                InitiativeId = initiative.Id
            };

            db.Fahrgaeste.Add(fahrgast);

            await db.SaveChangesAsync();

            fahrgast.Initiative = initiative;

            return Results.Ok(
                FahrgastMapper.CreateFahrgast(fahrgast)
            );
        });

        // Fahrgast löschen
        app.MapDelete("/api/v1/fahrgaeste/{id:int}", async (
            int id,
            AppDbContext db
        ) =>
        {
            var fahrgast = await db.Fahrgaeste
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fahrgast is null)
            {
                return Results.NotFound("Fahrgast wurde nicht gefunden.");
            }

            db.Fahrgaeste.Remove(fahrgast);

            await db.SaveChangesAsync();

            return Results.Ok("Fahrgast wurde gelöscht.");
        });

        return app;
    }
}
using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Mappers;
using BuergerbusAPI.Models;
using BuergerbusAPI.Services;
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
        app.MapGet("/api/v1/fahrgaeste", async (
            HttpContext httpContext,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var initiativeId = AuthUtils.GetInitiativeId(principal);
            if (!isAdmin && !initiativeId.HasValue)
            {
                return Results.Forbid();
            }

            var fahrgaeste = await db.Fahrgaeste
                .Include(f => f.Initiative)
                .AsNoTracking()
                .Where(f => isAdmin || f.InitiativeId == initiativeId)
                .OrderBy(f => f.Nachname)
                .ThenBy(f => f.Vorname)
                .ToListAsync();

            var result = fahrgaeste
                .Select(FahrgastMapper.CreateFahrgast);

            return Results.Ok(result);
        })
        .RequireAuthorization();

        // Einzelnen Fahrgast abrufen
        app.MapGet("/api/v1/fahrgaeste/{id:int}", async (
            int id,
            HttpContext httpContext,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var initiativeId = AuthUtils.GetInitiativeId(principal);
            if (!isAdmin && !initiativeId.HasValue)
            {
                return Results.Forbid();
            }

            var fahrgast = await db.Fahrgaeste
                .Include(f => f.Initiative)
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fahrgast is null)
            {
                return Results.NotFound("Fahrgast wurde nicht gefunden.");
            }

            if (!isAdmin && fahrgast.InitiativeId != initiativeId)
            {
                return Results.Forbid();
            }

            return Results.Ok(
                FahrgastMapper.CreateFahrgast(fahrgast)
            );
        })
        .RequireAuthorization();

        // Fahrgast erstellen
        app.MapPost("/api/v1/fahrgaeste", async (
            CreateFahrgastDto request,
            HttpContext httpContext,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var initiativeId = AuthUtils.GetInitiativeId(principal);
            if (!isAdmin)
            {
                if (!initiativeId.HasValue)
                {
                    return Results.Forbid();
                }

                if (request.InitiativeId != initiativeId.Value)
                {
                    return Results.Forbid();
                }
            }

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
                GeaendertAm = null,
                LetzteNutzung = request.LetzteNutzung,
                Aktiv = request.Aktiv,
                InitiativeId = request.InitiativeId
            };

            db.Fahrgaeste.Add(fahrgast);

            await db.SaveChangesAsync();

            fahrgast.Initiative = initiative;

            return Results.Ok(
                FahrgastMapper.CreateFahrgast(fahrgast)
            );
        })
        .RequireAuthorization();


        app.MapPut("/api/v1/fahrgaeste/{id:int}", async (
            int id,
            CreateFahrgastDto request,
            HttpContext httpContext,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var initiativeId = AuthUtils.GetInitiativeId(principal);
            if (!isAdmin)
            {
                if (!initiativeId.HasValue)
                {
                    return Results.Forbid();
                }

                if (request.InitiativeId != initiativeId.Value)
                {
                    return Results.Forbid();
                }
            }

            var fahrgast = await db.Fahrgaeste
                .Include(f => f.Initiative)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fahrgast is null)
            {
                return Results.NotFound("Fahrgast wurde nicht gefunden.");
            }

            if (!isAdmin && fahrgast.InitiativeId != initiativeId)
            {
                return Results.Forbid();
            }

            var initiative = await db.Initiativen
                .FirstOrDefaultAsync(i => i.Id == request.InitiativeId);

            if (initiative is null)
            {
                return Results.NotFound("Initiative wurde nicht gefunden.");
            }

            fahrgast.Vorname = request.Vorname;
            fahrgast.Nachname = request.Nachname;
            fahrgast.Adresse = request.Adresse;
            fahrgast.Email = request.Email;
            fahrgast.Telefonnummer = request.Telefonnummer;
            fahrgast.Bemerkung = request.Bemerkung;
            fahrgast.GeaendertAm = DateTime.UtcNow;
            fahrgast.InitiativeId = initiative.Id;
            fahrgast.LetzteNutzung = request.LetzteNutzung;
            fahrgast.Aktiv = request.Aktiv;

            await db.SaveChangesAsync();

            fahrgast.Initiative = initiative;

            return Results.Ok(FahrgastMapper.CreateFahrgast(fahrgast));
        })
        .RequireAuthorization();

        // Fahrgast löschen
        app.MapDelete("/api/v1/fahrgaeste/{id:int}", async (
            int id,
            HttpContext httpContext,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var initiativeId = AuthUtils.GetInitiativeId(principal);
            if (!isAdmin && !initiativeId.HasValue)
            {
                return Results.Forbid();
            }

            var fahrgast = await db.Fahrgaeste
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fahrgast is null)
            {
                return Results.NotFound("Fahrgast wurde nicht gefunden.");
            }

            if (!isAdmin && fahrgast.InitiativeId != initiativeId)
            {
                return Results.Forbid();
            }

            db.Fahrgaeste.Remove(fahrgast);

            await db.SaveChangesAsync();

            return Results.Ok("Fahrgast wurde gelöscht.");
        })
        .RequireAuthorization();

        return app;
    }
}
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
            AppDbContext db,
            int? initiativeId
        ) =>
        {
            var principal = httpContext.User;
            if (!AuthUtils.CanManagePassengers(principal))
            {
                return Results.Forbid();
            }

            var isAdmin = AuthUtils.IsAdmin(principal);
            var claimInitiativeId = AuthUtils.GetInitiativeId(principal);

            if (!isAdmin && !claimInitiativeId.HasValue)
            {
                return Results.Forbid();
            }

            if (!isAdmin && initiativeId.HasValue && claimInitiativeId.HasValue && initiativeId.Value != claimInitiativeId.Value)
            {
                return Results.Forbid();
            }

            var targetInitiativeId = initiativeId ?? claimInitiativeId;

            if (!targetInitiativeId.HasValue)
            {
                return Results.BadRequest("Initiative ist erforderlich.");
            }

            var fahrgaeste = await db.Fahrgaeste
                .Include(f => f.Initiative)
                .AsNoTracking()
                .Where(f => f.InitiativeId == targetInitiativeId.Value)
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
            if (!AuthUtils.CanManagePassengers(principal))
            {
                return Results.Forbid();
            }

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
            if (!AuthUtils.CanManagePassengers(principal))
            {
                return Results.Forbid();
            }

            var isAdmin = AuthUtils.IsAdmin(principal);
            var claimInitiativeId = AuthUtils.GetInitiativeId(principal);

            int targetInitiativeId;
            if (isAdmin)
            {
                if (!request.InitiativeId.HasValue || request.InitiativeId.Value <= 0)
                {
                    return Results.BadRequest("Initiative muss angegeben werden.");
                }

                targetInitiativeId = request.InitiativeId.Value;
            }
            else
            {
                if (!claimInitiativeId.HasValue)
                {
                    return Results.BadRequest("Benutzer hat keine Initiative zugeordnet.");
                }

                if (request.InitiativeId.HasValue && request.InitiativeId.Value != claimInitiativeId.Value)
                {
                    return Results.Forbid();
                }

                targetInitiativeId = claimInitiativeId.Value;
            }

            var initiative = await db.Initiativen
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == targetInitiativeId);

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
                LetzteNutzung = DateTime.UtcNow,
                Aktiv = request.Aktiv,
                InitiativeId = targetInitiativeId
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
            if (!AuthUtils.CanManagePassengers(principal))
            {
                return Results.Forbid();
            }

            var isAdmin = AuthUtils.IsAdmin(principal);
            var claimInitiativeId = AuthUtils.GetInitiativeId(principal);

            int targetInitiativeId;
            if (isAdmin)
            {
                if (!request.InitiativeId.HasValue || request.InitiativeId.Value <= 0)
                {
                    return Results.BadRequest("Initiative muss angegeben werden.");
                }

                targetInitiativeId = request.InitiativeId.Value;
            }
            else
            {
                if (!claimInitiativeId.HasValue)
                {
                    return Results.BadRequest("Benutzer hat keine Initiative zugeordnet.");
                }

                if (request.InitiativeId.HasValue && request.InitiativeId.Value != claimInitiativeId.Value)
                {
                    return Results.Forbid();
                }

                targetInitiativeId = claimInitiativeId.Value;
            }

            var fahrgast = await db.Fahrgaeste
                .Include(f => f.Initiative)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fahrgast is null)
            {
                return Results.NotFound("Fahrgast wurde nicht gefunden.");
            }

            if (!isAdmin && fahrgast.InitiativeId != claimInitiativeId)
            {
                return Results.Forbid();
            }

            var initiative = await db.Initiativen
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == targetInitiativeId);

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
            fahrgast.InitiativeId = targetInitiativeId;
            fahrgast.LetzteNutzung = DateTime.UtcNow;
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
            if (!AuthUtils.CanManagePassengers(principal))
            {
                return Results.Forbid();
            }

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

            await SoftDeleteFahrgastAsync(id, fahrgast, db);

            return Results.Ok("Fahrgast wurde deaktiviert und anonymisiert.");
        })
        .RequireAuthorization();

        return app;
    }

    private static async Task SoftDeleteFahrgastAsync(int fahrgastId, Fahrgast fahrgast, AppDbContext db)
    {
        fahrgast.Vorname = "Gelöschter";
        fahrgast.Nachname = "Fahrgast";
        fahrgast.Adresse = string.Empty;
        fahrgast.Email = null;
        fahrgast.Telefonnummer = string.Empty;
        fahrgast.Bemerkung = null;
        fahrgast.Aktiv = false;
        fahrgast.GeaendertAm = DateTime.UtcNow;

        var fahrtenTeilnehmer = await db.FahrtTeilnehmer
            .Where(tp => tp.FahrgastId == fahrgastId)
            .ToListAsync();

        foreach (var teilnehmer in fahrtenTeilnehmer)
        {
            teilnehmer.Vorname = "Gelöschter";
            teilnehmer.Nachname = "Fahrgast";
            teilnehmer.Adresse = string.Empty;
            teilnehmer.Telefonnummer = string.Empty;
        }

        var teilstrecken = await db.Teilstrecken
            .Where(ts => ts.FahrgastId == fahrgastId)
            .ToListAsync();

        foreach (var teilstrecke in teilstrecken)
        {
            teilstrecke.Abholadresse = string.Empty;
            teilstrecke.Zieladresse = string.Empty;
            teilstrecke.FahrgastId = fahrgastId;
            if (teilstrecke.Fahrgast is not null)
            {
                teilstrecke.Fahrgast.Vorname = "Gelöschter";
                teilstrecke.Fahrgast.Nachname = "Fahrgast";
                teilstrecke.Fahrgast.Adresse = string.Empty;
                teilstrecke.Fahrgast.Email = null;
                teilstrecke.Fahrgast.Telefonnummer = string.Empty;
                teilstrecke.Fahrgast.Bemerkung = null;
                teilstrecke.Fahrgast.Aktiv = false;
                teilstrecke.Fahrgast.GeaendertAm = DateTime.UtcNow;
            }
        }

        await db.SaveChangesAsync();
    }
}

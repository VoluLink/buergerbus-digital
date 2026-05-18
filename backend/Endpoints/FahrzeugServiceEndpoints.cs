using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BuergerbusAPI.Endpoints;

public static class FahrzeugServiceEndpoints
{
    private static readonly HashSet<string> ErlaubteSchadenStatus = new(StringComparer.OrdinalIgnoreCase)
    {
        "Offen",
        "In Bearbeitung",
        "Behoben",
        "Nicht reparierbar",
    };

    public static IEndpointRouteBuilder MapFahrzeugServiceEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/fahrzeuge/{fahrzeugId:int}/wartungen", async (
            int fahrzeugId,
            int? userId,
            AppDbContext db
        ) =>
        {
            var authResult = await LoadAuthorizedVehicleAsync(fahrzeugId, userId, db);
            if (authResult.Error != null)
            {
                return authResult.Error;
            }

            var wartungen = await db.Wartungen
                .AsNoTracking()
                .Where(w => w.FahrzeugId == fahrzeugId)
                .OrderByDescending(w => w.LetzterTermin)
                .Select(w => new WartungDto(
                    w.Id,
                    w.FahrzeugId,
                    w.InitiativeId,
                    w.LetzterTermin,
                    w.NaechsterTermin,
                    w.Grund,
                    w.Ort,
                    w.Kosten
                ))
                .ToListAsync();

            return Results.Ok(wartungen);
        });

        app.MapPost("/api/v1/fahrzeuge/{fahrzeugId:int}/wartungen", async (
            int fahrzeugId,
            int? userId,
            CreateWartungRequest request,
            AppDbContext db
        ) =>
        {
            var authResult = await LoadAuthorizedVehicleAsync(fahrzeugId, userId, db);
            if (authResult.Error != null)
            {
                return authResult.Error;
            }

            if (request.LetzterTermin == default)
            {
                return Results.BadRequest("LetzterTermin ist erforderlich.");
            }

            if (string.IsNullOrWhiteSpace(request.Ort))
            {
                return Results.BadRequest("Ort ist erforderlich.");
            }

            var wartung = new Wartungen
            {
                LetzterTermin = request.LetzterTermin,
                NaechsterTermin = request.NaechsterTermin,
                Grund = string.IsNullOrWhiteSpace(request.Grund) ? null : request.Grund.Trim(),
                Ort = request.Ort.Trim(),
                Kosten = request.Kosten,
                FahrzeugId = fahrzeugId,
                InitiativeId = authResult.Fahrzeug!.InitiativeId,
            };

            db.Wartungen.Add(wartung);
            await db.SaveChangesAsync();

            return Results.Created($"/api/v1/wartungen/{wartung.Id}", new WartungDto(
                wartung.Id,
                wartung.FahrzeugId,
                wartung.InitiativeId,
                wartung.LetzterTermin,
                wartung.NaechsterTermin,
                wartung.Grund,
                wartung.Ort,
                wartung.Kosten
            ));
        })
        .Accepts<CreateWartungRequest>("application/json")
        .Produces<WartungDto>(StatusCodes.Status201Created);

        app.MapPut("/api/v1/wartungen/{id:int}", async (
            int id,
            int? userId,
            UpdateWartungRequest request,
            AppDbContext db
        ) =>
        {
            var wartung = await db.Wartungen
                .Include(w => w.Fahrzeug)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (wartung == null)
            {
                return Results.NotFound("Wartung wurde nicht gefunden.");
            }

            var authResult = await EnsureUserCanAccessVehicleAsync(wartung.FahrzeugId, userId, db, wartung.Fahrzeug);
            if (authResult != null)
            {
                return authResult;
            }

            if (request.LetzterTermin == default)
            {
                return Results.BadRequest("LetzterTermin ist erforderlich.");
            }

            if (string.IsNullOrWhiteSpace(request.Ort))
            {
                return Results.BadRequest("Ort ist erforderlich.");
            }

            wartung.LetzterTermin = request.LetzterTermin;
            wartung.NaechsterTermin = request.NaechsterTermin;
            wartung.Grund = string.IsNullOrWhiteSpace(request.Grund) ? null : request.Grund.Trim();
            wartung.Ort = request.Ort.Trim();
            wartung.Kosten = request.Kosten;

            await db.SaveChangesAsync();

            return Results.Ok(new WartungDto(
                wartung.Id,
                wartung.FahrzeugId,
                wartung.InitiativeId,
                wartung.LetzterTermin,
                wartung.NaechsterTermin,
                wartung.Grund,
                wartung.Ort,
                wartung.Kosten
            ));
        })
        .Accepts<UpdateWartungRequest>("application/json")
        .Produces<WartungDto>(StatusCodes.Status200OK);

        app.MapDelete("/api/v1/wartungen/{id:int}", async (
            int id,
            int? userId,
            AppDbContext db
        ) =>
        {
            var wartung = await db.Wartungen
                .Include(w => w.Fahrzeug)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (wartung == null)
            {
                return Results.NotFound("Wartung wurde nicht gefunden.");
            }

            var authResult = await EnsureUserCanAccessVehicleAsync(wartung.FahrzeugId, userId, db, wartung.Fahrzeug);
            if (authResult != null)
            {
                return authResult;
            }

            db.Wartungen.Remove(wartung);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });

        app.MapGet("/api/v1/fahrzeuge/{fahrzeugId:int}/schaeden", async (
            int fahrzeugId,
            int? userId,
            AppDbContext db
        ) =>
        {
            var authResult = await LoadAuthorizedVehicleAsync(fahrzeugId, userId, db);
            if (authResult.Error != null)
            {
                return authResult.Error;
            }

            var schaeden = await db.Schaeden
                .AsNoTracking()
                .Where(s => s.FahrzeugId == fahrzeugId)
                .OrderByDescending(s => s.Enstanden_Am)
                .Select(s => new SchadenDto(
                    s.Id,
                    s.FahrzeugId,
                    s.InitiativeId,
                    s.Beschreibung,
                    s.Enstanden_Am,
                    s.Behoben_Am,
                    s.Status
                ))
                .ToListAsync();

            return Results.Ok(schaeden);
        });

        app.MapPost("/api/v1/fahrzeuge/{fahrzeugId:int}/schaeden", async (
            int fahrzeugId,
            int? userId,
            CreateSchadenRequest request,
            AppDbContext db
        ) =>
        {
            var authResult = await LoadAuthorizedVehicleAsync(fahrzeugId, userId, db);
            if (authResult.Error != null)
            {
                return authResult.Error;
            }

            var validationError = ValidateSchadenRequest(request.Beschreibung, request.Status, request.EntstandenAm);
            if (validationError != null)
            {
                return validationError;
            }

            var schaden = new Schaden
            {
                Beschreibung = request.Beschreibung.Trim(),
                Enstanden_Am = request.EntstandenAm,
                Behoben_Am = request.BehobenAm,
                Status = request.Status.Trim(),
                FahrzeugId = fahrzeugId,
                InitiativeId = authResult.Fahrzeug!.InitiativeId,
            };

            db.Schaeden.Add(schaden);
            await db.SaveChangesAsync();

            return Results.Created($"/api/v1/schaeden/{schaden.Id}", new SchadenDto(
                schaden.Id,
                schaden.FahrzeugId,
                schaden.InitiativeId,
                schaden.Beschreibung,
                schaden.Enstanden_Am,
                schaden.Behoben_Am,
                schaden.Status
            ));
        })
        .Accepts<CreateSchadenRequest>("application/json")
        .Produces<SchadenDto>(StatusCodes.Status201Created);

        app.MapPut("/api/v1/schaeden/{id:int}", async (
            int id,
            int? userId,
            UpdateSchadenRequest request,
            AppDbContext db
        ) =>
        {
            var schaden = await db.Schaeden
                .Include(s => s.Fahrzeug)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (schaden == null)
            {
                return Results.NotFound("Schaden wurde nicht gefunden.");
            }

            var authResult = await EnsureUserCanAccessVehicleAsync(schaden.FahrzeugId, userId, db, schaden.Fahrzeug);
            if (authResult != null)
            {
                return authResult;
            }

            var validationError = ValidateSchadenRequest(request.Beschreibung, request.Status, request.EntstandenAm);
            if (validationError != null)
            {
                return validationError;
            }

            schaden.Beschreibung = request.Beschreibung.Trim();
            schaden.Enstanden_Am = request.EntstandenAm;
            schaden.Behoben_Am = request.BehobenAm;
            schaden.Status = request.Status.Trim();

            await db.SaveChangesAsync();

            return Results.Ok(new SchadenDto(
                schaden.Id,
                schaden.FahrzeugId,
                schaden.InitiativeId,
                schaden.Beschreibung,
                schaden.Enstanden_Am,
                schaden.Behoben_Am,
                schaden.Status
            ));
        })
        .Accepts<UpdateSchadenRequest>("application/json")
        .Produces<SchadenDto>(StatusCodes.Status200OK);

        app.MapDelete("/api/v1/schaeden/{id:int}", async (
            int id,
            int? userId,
            AppDbContext db
        ) =>
        {
            var schaden = await db.Schaeden
                .Include(s => s.Fahrzeug)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (schaden == null)
            {
                return Results.NotFound("Schaden wurde nicht gefunden.");
            }

            var authResult = await EnsureUserCanAccessVehicleAsync(schaden.FahrzeugId, userId, db, schaden.Fahrzeug);
            if (authResult != null)
            {
                return authResult;
            }

            db.Schaeden.Remove(schaden);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });

        return app;
    }

    private static async Task<(Fahrzeug? Fahrzeug, IResult? Error)> LoadAuthorizedVehicleAsync(
        int fahrzeugId,
        int? userId,
        AppDbContext db
    )
    {
        var fahrzeug = await db.Fahrzeuge.FirstOrDefaultAsync(f => f.Id == fahrzeugId);
        if (fahrzeug == null)
        {
            return (null, Results.NotFound("Fahrzeug wurde nicht gefunden."));
        }

        var authResult = await EnsureUserCanAccessVehicleAsync(fahrzeugId, userId, db, fahrzeug);
        if (authResult != null)
        {
            return (null, authResult);
        }

        return (fahrzeug, null);
    }

    private static async Task<IResult?> EnsureUserCanAccessVehicleAsync(
        int fahrzeugId,
        int? userId,
        AppDbContext db,
        Fahrzeug? fahrzeug = null
    )
    {
        if (!userId.HasValue)
        {
            return Results.BadRequest("userId ist erforderlich.");
        }

        var user = await db.Benutzer
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null)
        {
            return Results.NotFound("Benutzer wurde nicht gefunden.");
        }

        var resolvedFahrzeug = fahrzeug ?? await db.Fahrzeuge.FirstOrDefaultAsync(f => f.Id == fahrzeugId);
        if (resolvedFahrzeug == null)
        {
            return Results.NotFound("Fahrzeug wurde nicht gefunden.");
        }

        if (resolvedFahrzeug.InitiativeId != user.InitiativeId)
        {
            return Results.Forbid();
        }

        return null;
    }

    private static IResult? ValidateSchadenRequest(string beschreibung, string status, DateTime entstandenAm)
    {
        if (string.IsNullOrWhiteSpace(beschreibung))
        {
            return Results.BadRequest("Beschreibung ist erforderlich.");
        }

        if (entstandenAm == default)
        {
            return Results.BadRequest("EntstandenAm ist erforderlich.");
        }

        if (string.IsNullOrWhiteSpace(status))
        {
            return Results.BadRequest("Status ist erforderlich.");
        }

        if (!ErlaubteSchadenStatus.Contains(status.Trim()))
        {
            return Results.BadRequest("Ungueltiger Schadenstatus.");
        }

        return null;
    }
}

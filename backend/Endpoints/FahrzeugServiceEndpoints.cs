using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using BuergerbusAPI.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
        app.MapGet("/api/v1/fahrzeuge", async (
            HttpContext httpContext,
            int? userId,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            var requestingInitiativeId = AuthUtils.GetInitiativeId(principal);
            var isAdmin = AuthUtils.IsAdmin(principal);

            if (!isAdmin && !requestingInitiativeId.HasValue)
            {
                return Results.Forbid();
            }

            var fahrzeuge = await db.Fahrzeuge
                .AsNoTracking()
                .Include(f => f.Initiative)
                .Where(f => isAdmin || f.InitiativeId == requestingInitiativeId)
                .OrderBy(f => f.Kennzeichen)
                .Select(f => new FahrzeugDto(
                    f.Id,
                    f.Kennzeichen,
                    f.Bezeichnung,
                    f.Kapazitaet,
                    f.Kilometerstand,
                    f.Betriebsaufnahme,
                    f.Bemerkung,
                    f.Status,
                    f.Aktiv,
                    f.InitiativeId,
                    f.Initiative != null ? f.Initiative.Name : null,
                    db.Wartungen
                        .Where(w => w.FahrzeugId == f.Id && w.LetzterTermin <= DateTime.Today)
                        .OrderByDescending(w => w.LetzterTermin)
                        .Select(w => (DateTime?)w.LetzterTermin)
                        .FirstOrDefault(),
                    db.Wartungen
                        .Where(w => w.FahrzeugId == f.Id && w.NaechsterTermin != null)
                        .OrderBy(w => w.NaechsterTermin)
                        .Select(w => w.NaechsterTermin)
                        .FirstOrDefault(),
                    db.Schaeden
                        .Where(s => s.FahrzeugId == f.Id && s.Status == "Offen")
                        .Count()
                ))
                .ToListAsync();

            return Results.Ok(fahrzeuge);
        })
        .RequireAuthorization();

        app.MapPost("/api/v1/fahrzeuge", async (
            HttpContext httpContext,
            int? userId,
            CreateFahrzeugRequest request,
            AppDbContext db
        ) =>
        {
            if (!AuthUtils.CanManageVehicles(httpContext.User))
            {
                return Results.Forbid();
            }

            var userResult = await LoadUserWithInitiativeAsync(httpContext.User, userId, db);
            if (userResult.Error != null)
            {
                return userResult.Error;
            }

            if (!AuthUtils.IsAdmin(httpContext.User) && request.InitiativeId != userResult.User!.InitiativeId)
            {
                return Results.Forbid();
            }

            var validationError = ValidateFahrzeugRequest(
                request.Kennzeichen,
                request.Bezeichnung,
                request.Kapazitaet,
                request.Kilometerstand,
                request.Betriebsaufnahme,
                request.InitiativeId
            );

            if (validationError != null)
            {
                return validationError;
            }

            var initiativeExists = await db.Initiativen.AnyAsync(i => i.Id == request.InitiativeId);
            if (!initiativeExists)
            {
                return Results.BadRequest("Initiative ist ungueltig.");
            }

            var status = string.IsNullOrWhiteSpace(request.Status)
                ? "Einsatzbereit"
                : request.Status.Trim();

            var fahrzeug = new Fahrzeug
            {
                Kennzeichen = request.Kennzeichen.Trim(),
                Bezeichnung = request.Bezeichnung.Trim(),
                Kapazitaet = request.Kapazitaet,
                Kilometerstand = request.Kilometerstand,
                Betriebsaufnahme = request.Betriebsaufnahme,
                Bemerkung = string.IsNullOrWhiteSpace(request.Bemerkung) ? null : request.Bemerkung.Trim(),
                Status = status,
                Aktiv = true,
                InitiativeId = request.InitiativeId,
            };

            db.Fahrzeuge.Add(fahrzeug);
            await db.SaveChangesAsync();

            var initiativeName = await db.Initiativen
                .Where(i => i.Id == fahrzeug.InitiativeId)
                .Select(i => i.Name)
                .FirstOrDefaultAsync();

            return Results.Created($"/api/v1/fahrzeuge/{fahrzeug.Id}", new FahrzeugDto(
                fahrzeug.Id,
                fahrzeug.Kennzeichen,
                fahrzeug.Bezeichnung,
                fahrzeug.Kapazitaet,
                fahrzeug.Kilometerstand,
                fahrzeug.Betriebsaufnahme,
                fahrzeug.Bemerkung,
                fahrzeug.Status,
                fahrzeug.Aktiv,
                fahrzeug.InitiativeId,
                initiativeName,
                null,
                null,
                0
            ));
        })
        .Accepts<CreateFahrzeugRequest>("application/json")
        .Produces<FahrzeugDto>(StatusCodes.Status201Created)
        .RequireAuthorization();

        app.MapPut("/api/v1/fahrzeuge/{id:int}", async (
            int id,
            HttpContext httpContext,
            int? userId,
            UpdateFahrzeugRequest request,
            AppDbContext db
        ) =>
        {
            if (!AuthUtils.CanManageVehicles(httpContext.User))
            {
                return Results.Forbid();
            }

            var fahrzeug = await db.Fahrzeuge.FirstOrDefaultAsync(f => f.Id == id);
            if (fahrzeug == null)
            {
                return Results.NotFound("Fahrzeug wurde nicht gefunden.");
            }

            var authResult = await EnsureUserCanAccessVehicleAsync(httpContext.User, id, userId, db, fahrzeug);
            if (authResult != null)
            {
                return authResult;
            }

            var userResult = await LoadUserWithInitiativeAsync(httpContext.User, userId, db);
            if (userResult.Error != null)
            {
                return userResult.Error;
            }

            if (!AuthUtils.IsAdmin(httpContext.User) && request.InitiativeId != userResult.User!.InitiativeId)
            {
                return Results.Forbid();
            }

            var validationError = ValidateFahrzeugRequest(
                request.Kennzeichen,
                request.Bezeichnung,
                request.Kapazitaet,
                request.Kilometerstand,
                request.Betriebsaufnahme,
                request.InitiativeId
            );

            if (validationError != null)
            {
                return validationError;
            }

            var initiativeExists = await db.Initiativen.AnyAsync(i => i.Id == request.InitiativeId);
            if (!initiativeExists)
            {
                return Results.BadRequest("Initiative ist ungueltig.");
            }

            fahrzeug.Kennzeichen = request.Kennzeichen.Trim();
            fahrzeug.Bezeichnung = request.Bezeichnung.Trim();
            fahrzeug.Kapazitaet = request.Kapazitaet;
            fahrzeug.Kilometerstand = request.Kilometerstand;
            fahrzeug.Betriebsaufnahme = request.Betriebsaufnahme;
            fahrzeug.Bemerkung = string.IsNullOrWhiteSpace(request.Bemerkung)
                ? null
                : request.Bemerkung.Trim();
            fahrzeug.Status = string.IsNullOrWhiteSpace(request.Status)
                ? "Einsatzbereit"
                : request.Status.Trim();
            fahrzeug.InitiativeId = request.InitiativeId;

            await db.SaveChangesAsync();

            var initiativeName = await db.Initiativen
                .Where(i => i.Id == fahrzeug.InitiativeId)
                .Select(i => i.Name)
                .FirstOrDefaultAsync();

            var letzteWartung = await db.Wartungen
                .Where(w => w.FahrzeugId == fahrzeug.Id && w.LetzterTermin <= DateTime.Today)
                .OrderByDescending(w => w.LetzterTermin)
                .Select(w => (DateTime?)w.LetzterTermin)
                .FirstOrDefaultAsync();

            var naechsteWartung = await db.Wartungen
                .Where(w => w.FahrzeugId == fahrzeug.Id && w.NaechsterTermin != null)
                .OrderBy(w => w.NaechsterTermin)
                .Select(w => w.NaechsterTermin)
                .FirstOrDefaultAsync();

            var offeneSchaeden = await db.Schaeden
                .Where(s => s.FahrzeugId == fahrzeug.Id && s.Status == "Offen")
                .CountAsync();

            return Results.Ok(new FahrzeugDto(
                fahrzeug.Id,
                fahrzeug.Kennzeichen,
                fahrzeug.Bezeichnung,
                fahrzeug.Kapazitaet,
                fahrzeug.Kilometerstand,
                fahrzeug.Betriebsaufnahme,
                fahrzeug.Bemerkung,
                fahrzeug.Status,
                fahrzeug.Aktiv,
                fahrzeug.InitiativeId,
                initiativeName,
                letzteWartung,
                naechsteWartung,
                offeneSchaeden
            ));
        })
        .Accepts<UpdateFahrzeugRequest>("application/json")
        .Produces<FahrzeugDto>(StatusCodes.Status200OK)
        .RequireAuthorization();

        app.MapDelete("/api/v1/fahrzeuge/{id:int}", async (
            int id,
            HttpContext httpContext,
            int? userId,
            AppDbContext db
        ) =>
        {
            if (!AuthUtils.CanManageVehicles(httpContext.User))
            {
                return Results.Forbid();
            }

            var fahrzeug = await db.Fahrzeuge.FirstOrDefaultAsync(f => f.Id == id);
            if (fahrzeug == null)
            {
                return Results.NotFound("Fahrzeug wurde nicht gefunden.");
            }

            var authResult = await EnsureUserCanAccessVehicleAsync(httpContext.User, id, userId, db, fahrzeug);
            if (authResult != null)
            {
                return authResult;
            }

            db.Fahrzeuge.Remove(fahrzeug);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .RequireAuthorization();

        app.MapGet("/api/v1/fahrzeuge/{fahrzeugId:int}/wartungen", async (
            int fahrzeugId,
            HttpContext httpContext,
            int? userId,
            AppDbContext db
        ) =>
        {
            var authResult = await LoadAuthorizedVehicleAsync(httpContext.User, fahrzeugId, userId, db);
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
        })
        .RequireAuthorization();

        app.MapPost("/api/v1/fahrzeuge/{fahrzeugId:int}/wartungen", async (
            int fahrzeugId,
            HttpContext httpContext,
            int? userId,
            CreateWartungRequest request,
            AppDbContext db
        ) =>
        {
            if (!AuthUtils.CanManageVehicles(httpContext.User))
            {
                return Results.Forbid();
            }

            var authResult = await LoadAuthorizedVehicleAsync(httpContext.User, fahrzeugId, userId, db);
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
        .Produces<WartungDto>(StatusCodes.Status201Created)
        .RequireAuthorization();

        app.MapPut("/api/v1/wartungen/{id:int}", async (
            int id,
            HttpContext httpContext,
            int? userId,
            UpdateWartungRequest request,
            AppDbContext db
        ) =>
        {
            if (!AuthUtils.CanManageVehicles(httpContext.User))
            {
                return Results.Forbid();
            }

            var wartung = await db.Wartungen
                .Include(w => w.Fahrzeug)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (wartung == null)
            {
                return Results.NotFound("Wartung wurde nicht gefunden.");
            }

            var authResult = await EnsureUserCanAccessVehicleAsync(httpContext.User, wartung.FahrzeugId, userId, db, wartung.Fahrzeug);
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
        .Produces<WartungDto>(StatusCodes.Status200OK)
        .RequireAuthorization();

        app.MapDelete("/api/v1/wartungen/{id:int}", async (
            int id,
            HttpContext httpContext,
            int? userId,
            AppDbContext db
        ) =>
        {
            if (!AuthUtils.CanManageVehicles(httpContext.User))
            {
                return Results.Forbid();
            }

            var wartung = await db.Wartungen
                .Include(w => w.Fahrzeug)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (wartung == null)
            {
                return Results.NotFound("Wartung wurde nicht gefunden.");
            }

            var authResult = await EnsureUserCanAccessVehicleAsync(httpContext.User, wartung.FahrzeugId, userId, db, wartung.Fahrzeug);
            if (authResult != null)
            {
                return authResult;
            }

            db.Wartungen.Remove(wartung);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .RequireAuthorization();

        app.MapGet("/api/v1/fahrzeuge/{fahrzeugId:int}/schaeden", async (
            int fahrzeugId,
            HttpContext httpContext,
            int? userId,
            AppDbContext db
        ) =>
        {
            var authResult = await LoadAuthorizedVehicleAsync(httpContext.User, fahrzeugId, userId, db);
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
        })
        .RequireAuthorization();

        app.MapPost("/api/v1/fahrzeuge/{fahrzeugId:int}/schaeden", async (
            int fahrzeugId,
            HttpContext httpContext,
            int? userId,
            CreateSchadenRequest request,
            AppDbContext db
        ) =>
        {
            if (!AuthUtils.CanManageVehicles(httpContext.User))
            {
                return Results.Forbid();
            }

            var authResult = await LoadAuthorizedVehicleAsync(httpContext.User, fahrzeugId, userId, db);
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
        .Produces<SchadenDto>(StatusCodes.Status201Created)
        .RequireAuthorization();

        app.MapPut("/api/v1/schaeden/{id:int}", async (
            int id,
            HttpContext httpContext,
            int? userId,
            UpdateSchadenRequest request,
            AppDbContext db
        ) =>
        {
            if (!AuthUtils.CanManageVehicles(httpContext.User))
            {
                return Results.Forbid();
            }

            var schaden = await db.Schaeden
                .Include(s => s.Fahrzeug)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (schaden == null)
            {
                return Results.NotFound("Schaden wurde nicht gefunden.");
            }

            var authResult = await EnsureUserCanAccessVehicleAsync(httpContext.User, schaden.FahrzeugId, userId, db, schaden.Fahrzeug);
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
        .Produces<SchadenDto>(StatusCodes.Status200OK)
        .RequireAuthorization();

        app.MapDelete("/api/v1/schaeden/{id:int}", async (
            int id,
            HttpContext httpContext,
            int? userId,
            AppDbContext db
        ) =>
        {
            if (!AuthUtils.CanManageVehicles(httpContext.User))
            {
                return Results.Forbid();
            }

            var schaden = await db.Schaeden
                .Include(s => s.Fahrzeug)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (schaden == null)
            {
                return Results.NotFound("Schaden wurde nicht gefunden.");
            }

            var authResult = await EnsureUserCanAccessVehicleAsync(httpContext.User, schaden.FahrzeugId, userId, db, schaden.Fahrzeug);
            if (authResult != null)
            {
                return authResult;
            }

            db.Schaeden.Remove(schaden);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .RequireAuthorization();

        return app;
    }

    private static async Task<(Fahrzeug? Fahrzeug, IResult? Error)> LoadAuthorizedVehicleAsync(
        ClaimsPrincipal principal,
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

        var authResult = await EnsureUserCanAccessVehicleAsync(principal, fahrzeugId, userId, db, fahrzeug);
        if (authResult != null)
        {
            return (null, authResult);
        }

        return (fahrzeug, null);
    }

    private static async Task<IResult?> EnsureUserCanAccessVehicleAsync(
        ClaimsPrincipal principal,
        int fahrzeugId,
        int? userId,
        AppDbContext db,
        Fahrzeug? fahrzeug = null
    )
    {
        if (AuthUtils.IsAdmin(principal))
        {
            return null;
        }

        var userResult = await LoadUserWithInitiativeAsync(principal, userId, db);
        if (userResult.Error != null)
        {
            return userResult.Error;
        }

        var resolvedFahrzeug = fahrzeug ?? await db.Fahrzeuge.FirstOrDefaultAsync(f => f.Id == fahrzeugId);
        if (resolvedFahrzeug == null)
        {
            return Results.NotFound("Fahrzeug wurde nicht gefunden.");
        }

        if (resolvedFahrzeug.InitiativeId != userResult.User!.InitiativeId)
        {
            return Results.Forbid();
        }

        return null;
    }

    private static async Task<(Benutzer? User, IResult? Error)> LoadUserWithInitiativeAsync(
        ClaimsPrincipal principal,
        int? userId,
        AppDbContext db
    )
    {
        var tokenUserId = AuthUtils.GetUserId(principal);
        if (!tokenUserId.HasValue)
        {
            return (null, Results.Forbid());
        }

        if (!AuthUtils.IsAdmin(principal))
        {
            if (userId.HasValue && userId.Value != tokenUserId.Value)
            {
                return (null, Results.Forbid());
            }

            userId = tokenUserId.Value;
        }
        else
        {
            userId ??= tokenUserId.Value;
        }

        var user = await db.Benutzer
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null)
        {
            return (null, Results.NotFound("Benutzer wurde nicht gefunden."));
        }

        if (AuthUtils.IsAdmin(principal))
        {
            return (user, null);
        }

        if (user.InitiativeId <= 0)
        {
            return (null, Results.BadRequest("Benutzer hat keine gueltige Initiative."));
        }

        var initiativeExists = await db.Initiativen.AnyAsync(i => i.Id == user.InitiativeId);
        if (!initiativeExists)
        {
            return (null, Results.BadRequest("Benutzer hat keine gueltige Initiative."));
        }

        return (user, null);
    }

    private static IResult? ValidateFahrzeugRequest(
        string kennzeichen,
        string bezeichnung,
        byte kapazitaet,
        int kilometerstand,
        DateTime betriebsaufnahme,
        int initiativeId
    )
    {
        if (string.IsNullOrWhiteSpace(kennzeichen))
        {
            return Results.BadRequest("Kennzeichen ist erforderlich.");
        }

        if (string.IsNullOrWhiteSpace(bezeichnung))
        {
            return Results.BadRequest("Bezeichnung ist erforderlich.");
        }

        if (kapazitaet < 1 || kapazitaet > 8)
        {
            return Results.BadRequest("Kapazitaet muss zwischen 1 und 8 liegen.");
        }

        if (kilometerstand < 0)
        {
            return Results.BadRequest("Kilometerstand darf nicht negativ sein.");
        }

        if (betriebsaufnahme == default)
        {
            return Results.BadRequest("Betriebsaufnahme ist erforderlich.");
        }

        if (initiativeId <= 0)
        {
            return Results.BadRequest("Initiative ist erforderlich.");
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

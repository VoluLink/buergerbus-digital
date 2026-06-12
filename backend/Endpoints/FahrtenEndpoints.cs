using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Mappers;
using BuergerbusAPI.Models;
using BuergerbusAPI.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BuergerbusAPI.Endpoints;

public static class FahrtenEndpoints
{
    private static bool IsRental(string? fahrttyp)
    => string.Equals(fahrttyp, "Vermietung", StringComparison.OrdinalIgnoreCase)
       || string.Equals(fahrttyp, "rental", StringComparison.OrdinalIgnoreCase);

    private static bool IsPublished(string? status)
        => !string.IsNullOrWhiteSpace(status)
           && status.Contains("veröffentlicht", StringComparison.OrdinalIgnoreCase)
           || status?.Contains("published", StringComparison.OrdinalIgnoreCase) == true;

    private static bool IsOpenRideStatus(string? status)
        => string.Equals(status, "Offen", StringComparison.OrdinalIgnoreCase)
           || string.Equals(status, "Open", StringComparison.OrdinalIgnoreCase);

    private static bool IsThemeRide(string? rideType)
        => string.Equals(rideType, "Themenfahrt", StringComparison.OrdinalIgnoreCase)
           || string.Equals(rideType, "theme", StringComparison.OrdinalIgnoreCase);

    private static bool IsRentalRide(string? rideType)
        => string.Equals(rideType, "Vermietung", StringComparison.OrdinalIgnoreCase)
           || string.Equals(rideType, "rental", StringComparison.OrdinalIgnoreCase);

    private static bool IsDriverVisibleRide(Fahrten ride, int? fahrerId)
          => IsPublished(ride.Status)
              || IsOpenRideStatus(ride.Status)
           || IsThemeRide(ride.Fahrttyp)
           || IsRentalRide(ride.Fahrttyp)
           || (fahrerId.HasValue && ride.FahrerId == fahrerId.Value);
    private static async Task<int?> ResolveFahrerIdAsync(AppDbContext db, int? userId)
    {
        if (!userId.HasValue)
        {
            return null;
        }

        return await db.Fahrer
            .AsNoTracking()
            .Where(f => f.BenutzerId == userId.Value)
            .Select(f => (int?)f.Id)
            .FirstOrDefaultAsync();
    }

    private static async Task<IResult?> ValidateRideAccessAsync(
        ClaimsPrincipal principal,
        AppDbContext db,
        Fahrten ride,
        int? selectedInitiativeId = null,
        bool allowDriverInitiativeRead = false)
    {
        var isAdmin = AuthUtils.IsAdmin(principal);
        var initiativeId = AuthUtils.GetInitiativeId(principal);
        var userId = AuthUtils.GetUserId(principal);
        var fahrerId = await ResolveFahrerIdAsync(db, userId);
        var isDriver = principal.IsInRole("Fahrer");
        var isGuest = principal.IsInRole("Gast");

        if (isAdmin)
        {
            if (selectedInitiativeId.HasValue && ride.InitiativeId != selectedInitiativeId.Value)
            {
                return Results.Forbid();
            }

            return null;
        }

        if (!initiativeId.HasValue || ride.InitiativeId != initiativeId.Value)
        {
            return Results.Forbid();
        }

        if (isGuest && !IsPublished(ride.Status))
        {
            return Results.Forbid();
        }

        if (isDriver && allowDriverInitiativeRead)
        {
            if (!IsPublished(ride.Status))
            {
                return Results.Forbid();
            }

            return null;
        }

        if (isDriver && !IsPublished(ride.Status) && ride.FahrerId.HasValue && fahrerId.HasValue && ride.FahrerId.Value != fahrerId.Value)
        {
            return Results.Forbid();
        }

        return null;
    }

    private static IQueryable<Fahrten> BuildAccessFilteredQuery(
        AppDbContext db,
        ClaimsPrincipal principal,
        int? selectedInitiativeId,
        int? fahrerId)
    {
        var isAdmin = AuthUtils.IsAdmin(principal);
        var initiativeId = AuthUtils.GetInitiativeId(principal);
        var isDriver = principal.IsInRole("Fahrer");
        var isGuest = principal.IsInRole("Gast");

        var query = db.Fahrten
            .Include(f => f.AngelegtVonUser)
            .Include(f => f.Teilnehmer)
                .ThenInclude(tp => tp.Fahrgast)
            .Include(f => f.Teilnehmer)
                .ThenInclude(tp => tp.Teilstrecken)
                    .ThenInclude(t => t.Fahrgast)
            .Include(f => f.Teilstrecken)
                .ThenInclude(t => t.Fahrgast)
            .AsNoTracking();

        if (isAdmin)
        {
            if (selectedInitiativeId.HasValue)
            {
                query = query.Where(f => f.InitiativeId == selectedInitiativeId.Value);
            }

            return query;
        }

        if (!initiativeId.HasValue)
        {
            return query.Where(_ => false);
        }

        query = query.Where(f => f.InitiativeId == initiativeId.Value);

        if (isGuest)
        {
            return query.Where(f =>
                !string.IsNullOrWhiteSpace(f.Status)
                && (
                    f.Status.Contains("veröffentlicht")
                    || f.Status.Contains("published")
                ));
        }

        if (isDriver)
        {
            if (fahrerId.HasValue)
            {
                var currentFahrerId = fahrerId.Value;

                return query.Where(f =>
                    (!string.IsNullOrWhiteSpace(f.Status)
                    && (
                        f.Status.Contains("veröffentlicht")
                        || f.Status.Contains("published")
                        || f.Status == "Offen"
                        || f.Status == "Open"
                    ))
                    || f.Fahrttyp == "Themenfahrt"
                    || f.Fahrttyp == "theme"
                    || f.Fahrttyp == "Vermietung"
                    || f.Fahrttyp == "rental"
                    || f.FahrerId == currentFahrerId);
            }

            return query.Where(f =>
                (!string.IsNullOrWhiteSpace(f.Status)
                && (
                    f.Status.Contains("veröffentlicht")
                    || f.Status.Contains("published")
                    || f.Status == "Offen"
                    || f.Status == "Open"
                ))
                || f.Fahrttyp == "Themenfahrt"
                || f.Fahrttyp == "theme"
                || f.Fahrttyp == "Vermietung"
                || f.Fahrttyp == "rental");
        }

        return query;
    }

    private static void ApplyRideMetadata(Fahrten ride, FahrtMetaDto meta, int initiativeId, int userId)
    {
        ride.Titel = meta.Titel;
        ride.Datum = meta.Datum;
        ride.DatumBis = meta.DatumBis;
        ride.Zielort = meta.Zielort;
        ride.Fahrttyp = meta.Fahrttyp;
        ride.Startzeit = meta.Startzeit;
        ride.Endzeit = meta.Endzeit;
        ride.Bemerkung = meta.Bemerkung;
        ride.Status = meta.Status;
        ride.FahrerId = meta.FahrerId;
        ride.FahrzeugId = meta.FahrzeugId;
        ride.InitiativeId = initiativeId;
        ride.AngelegtVonUserId = userId;
        ride.AngelegtAm = DateTime.UtcNow;
    }

    private static async Task<IResult?> ValidateRideWriteAsync(
        AppDbContext db,
        ClaimsPrincipal principal,
        FahrtMetaDto meta,
        List<CreateFahrtTeilnehmerDto> teilnehmer,
        int? ignoreRideId = null)
    {
        if (!AuthUtils.GetUserId(principal).HasValue)
            return Results.Unauthorized();

        var isAdmin = AuthUtils.IsAdmin(principal);
        var userInitiativeId = AuthUtils.GetInitiativeId(principal);

        var targetInitiativeId = isAdmin && meta.InitiativeId.HasValue
            ? meta.InitiativeId.Value
            : userInitiativeId;

        if (!targetInitiativeId.HasValue)
            return Results.Forbid();

        var isRental =
            string.Equals(meta.Fahrttyp, "rental", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(meta.Fahrttyp, "Vermietung", StringComparison.OrdinalIgnoreCase);

        // =========================
        // RENTAL EARLY EXIT LOGIC
        // =========================
        if (isRental)
        {
            if (string.IsNullOrWhiteSpace(meta.Titel))
                return Results.BadRequest("Titel ist erforderlich.");

            if (meta.Startzeit == default)
                return Results.BadRequest("Startzeit ist erforderlich.");

            //return null; // kein weiterer Check!
        }

        // =========================
        // NORMAL RIDES ONLY BELOW
        // =========================

        if (string.IsNullOrWhiteSpace(meta.Titel) && !isRental)
            return Results.BadRequest("Titel ist erforderlich.");

        if (string.IsNullOrWhiteSpace(meta.Zielort) && !isRental)
            return Results.BadRequest("Zielort ist erforderlich.");

        if (string.IsNullOrWhiteSpace(meta.Fahrttyp) && !isRental)
            return Results.BadRequest("Fahrttyp ist erforderlich.");

        if (teilnehmer.Count == 0 && !isRental)
            return Results.BadRequest("Mindestens ein Teilnehmer ist erforderlich.");

        if (teilnehmer.Count > 8 && !isRental)
            return Results.BadRequest("Eine Fahrt darf maximal 8 Teilnehmer haben.");

        if (!meta.FahrzeugId.HasValue)
            return Results.BadRequest("Ein Fahrzeug muss ausgewählt werden.");

        var vehicle = await db.Fahrzeuge
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == meta.FahrzeugId.Value);

        if (vehicle is null)
            return Results.NotFound("Fahrzeug wurde nicht gefunden.");

        if (vehicle.InitiativeId != targetInitiativeId.Value)
            return Results.Forbid();

        if (!vehicle.Aktiv)
            return Results.BadRequest("Fahrzeug ist inaktiv.");

        var requestedFahrerId = meta.FahrerId;

        if (requestedFahrerId.HasValue && !isRental)
        {
            var driver = await db.Fahrer
                .Include(f => f.Benutzer)
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == requestedFahrerId.Value);

            if (driver is null)
                return Results.NotFound("Fahrer wurde nicht gefunden.");

            if (driver.Benutzer.InitiativeId != targetInitiativeId.Value)
                return Results.Forbid();

            if (!driver.Aktiv)
                return Results.BadRequest("Fahrer ist inaktiv.");
        }

        var rideStart = meta.Startzeit;
        var endDate = meta.DatumBis ?? meta.Datum;
        var rideExclusiveEnd = meta.Endzeit ?? meta.Startzeit.Date.AddDays(1);

        if (meta.FahrzeugId.HasValue)
        {
            var vehicleBusy = await db.Fahrten.AsNoTracking().AnyAsync(f =>
                f.FahrzeugId == meta.FahrzeugId.Value
                && f.InitiativeId == targetInitiativeId.Value
                && (!ignoreRideId.HasValue || f.Id != ignoreRideId.Value)
                && f.Startzeit < rideExclusiveEnd
                && (f.Endzeit ?? f.Startzeit.Date.AddDays(1)) > rideStart);

            if (!vehicleBusy)
                return null;

            if (isRental)
            {
                return Results.Conflict("Fahrzeug ist in diesem Zeitraum bereits vermietet.");
            }

            return Results.Conflict("Fahrzeug ist in diesem Zeitraum bereits belegt.");
        }

        if (requestedFahrerId.HasValue && !isRental)
        {
            var driverBusy = await db.Fahrten.AsNoTracking().AnyAsync(f =>
                f.FahrerId == requestedFahrerId.Value
                && f.InitiativeId == targetInitiativeId.Value
                && (!ignoreRideId.HasValue || f.Id != ignoreRideId.Value)
                && f.Startzeit < rideExclusiveEnd
                && (f.Endzeit ?? f.Startzeit.Date.AddDays(1)) > rideStart);

            if (driverBusy)
                return Results.Conflict("Fahrer ist in diesem Zeitraum bereits eingeplant.");
        }

        foreach (var participant in teilnehmer)
        {
            if (string.IsNullOrWhiteSpace(participant.Vorname) ||
                string.IsNullOrWhiteSpace(participant.Nachname))
                return Results.BadRequest("Teilnehmer benötigen Vorname und Nachname.");

            if (string.IsNullOrWhiteSpace(participant.Abholadresse))
                return Results.BadRequest("Teilnehmer benötigen eine Abholadresse.");

            if (string.IsNullOrWhiteSpace(participant.Zieladresse))
                return Results.BadRequest("Teilnehmer benötigen eine Zieladresse.");

            if (participant.AlsStammgastSpeichern &&
                string.IsNullOrWhiteSpace(participant.Adresse) &&
                string.IsNullOrWhiteSpace(participant.Abholadresse))
                return Results.BadRequest("Adresse ist erforderlich, wenn der Teilnehmer als Stammgast gespeichert werden soll.");

            if (participant.FahrgastId.HasValue)
            {
                var guest = await db.Fahrgaeste
                    .AsNoTracking()
                    .FirstOrDefaultAsync(f => f.Id == participant.FahrgastId.Value);

                if (guest is null)
                    return Results.NotFound("Fahrgast wurde nicht gefunden.");

                if (guest.InitiativeId != targetInitiativeId.Value)
                    return Results.Forbid();
            }
        }

        return null;
    }

    private static async Task<Fahrten> MaterializeRideAsync(
        AppDbContext db,
        ClaimsPrincipal principal,
        CreateFahrtRequest request,
        int? existingRideId = null)
    {
        var userId = AuthUtils.GetUserId(principal)!.Value;
        var isAdmin = AuthUtils.IsAdmin(principal);
        var targetInitiativeId = isAdmin && request.Fahrt.InitiativeId.HasValue
            ? request.Fahrt.InitiativeId.Value
            : AuthUtils.GetInitiativeId(principal)!.Value;

        var ride = existingRideId.HasValue
            ? await db.Fahrten
                .Include(f => f.Teilnehmer)
                    .ThenInclude(tp => tp.Teilstrecken)
                .FirstAsync(f => f.Id == existingRideId.Value)
            : new Fahrten();

        if (existingRideId.HasValue)
        {
            db.Teilstrecken.RemoveRange(ride.Teilstrecken);
            db.FahrtTeilnehmer.RemoveRange(ride.Teilnehmer);
        }

        ApplyRideMetadata(ride, request.Fahrt, targetInitiativeId, userId);

        ride.Teilnehmer.Clear();
        ride.Teilstrecken.Clear();

        foreach (var (participantRequest, index) in request.Teilnehmer.Select((value, index) => (value, index)))
        {
            FahrtTeilnehmer? savedParticipant = null;
            Fahrgast? savedGuest = null;

            if (participantRequest.FahrgastId.HasValue)
            {
                savedGuest = await db.Fahrgaeste.FirstAsync(f => f.Id == participantRequest.FahrgastId.Value);
                savedGuest.LetzteNutzung = ride.Startzeit;

                savedParticipant = new FahrtTeilnehmer
                {
                    FahrgastId = savedGuest.Id,
                    Vorname = savedGuest.Vorname,
                    Nachname = savedGuest.Nachname,
                    Adresse = savedGuest.Adresse,
                    Telefonnummer = savedGuest.Telefonnummer,
                    IstTemporaer = false,
                    AlsStammgastGespeichert = false,
                };
            }
            else if (participantRequest.AlsStammgastSpeichern)
            {
                var stammgastAdresse = !string.IsNullOrWhiteSpace(participantRequest.Adresse)
                    ? participantRequest.Adresse.Trim()
                    : participantRequest.Abholadresse.Trim();

                savedGuest = new Fahrgast
                {
                    Vorname = participantRequest.Vorname.Trim(),
                    Nachname = participantRequest.Nachname.Trim(),
                    Adresse = stammgastAdresse,
                    Email = null,
                    Telefonnummer = string.IsNullOrWhiteSpace(participantRequest.Telefonnummer) ? null : participantRequest.Telefonnummer.Trim(),
                    Bemerkung = null,
                    AngelegtAm = DateTime.UtcNow,
                    GeaendertAm = null,
                    LetzteNutzung = ride.Startzeit,
                    Aktiv = true,
                    InitiativeId = targetInitiativeId,
                };

                db.Fahrgaeste.Add(savedGuest);

                savedParticipant = new FahrtTeilnehmer
                {
                    Fahrgast = savedGuest,
                    Vorname = savedGuest.Vorname,
                    Nachname = savedGuest.Nachname,
                    Adresse = stammgastAdresse,
                    Telefonnummer = savedGuest.Telefonnummer,
                    IstTemporaer = false,
                    AlsStammgastGespeichert = true,
                };
            }
            else
            {
                savedParticipant = new FahrtTeilnehmer
                {
                    FahrgastId = null,
                    Vorname = participantRequest.Vorname.Trim(),
                    Nachname = participantRequest.Nachname.Trim(),
                    Adresse = string.IsNullOrWhiteSpace(participantRequest.Adresse) ? null : participantRequest.Adresse.Trim(),
                    Telefonnummer = string.IsNullOrWhiteSpace(participantRequest.Telefonnummer) ? null : participantRequest.Telefonnummer.Trim(),
                    IstTemporaer = true,
                    AlsStammgastGespeichert = false,
                };
            }

            ride.Teilnehmer.Add(savedParticipant);

            savedParticipant.Teilstrecken.Add(new Teilstrecke
            {
                Fahrt = ride,
                FahrtTeilnehmer = savedParticipant,
                Abholadresse = participantRequest.Abholadresse.Trim(),
                Zieladresse = participantRequest.Zieladresse.Trim(),
                Startzeit = participantRequest.Startzeit,
                Endzeit = participantRequest.Endzeit,
                Reihenfolge = participantRequest.Reihenfolge ?? index + 1,
                Status = participantRequest.Status,
                Fahrgast = savedGuest,
                FahrgastId = savedGuest != null && savedGuest.Id > 0 ? savedGuest.Id : null,
            });
        }

        if (!existingRideId.HasValue)
        {
            db.Fahrten.Add(ride);
        }

        await db.SaveChangesAsync();

        return ride;
    }

    public static IEndpointRouteBuilder MapFahrtenEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/fahrten", async (
            HttpContext httpContext,
            AppDbContext db,
            int? initiativeId
        ) =>
        {
            var user = httpContext.User;
            if (!AuthUtils.IsAdmin(user) && !AuthUtils.GetInitiativeId(user).HasValue)
            {
                return Results.Forbid();
            }

            var fahrerId = await ResolveFahrerIdAsync(db, AuthUtils.GetUserId(user));
            var query = BuildAccessFilteredQuery(db, user, initiativeId, fahrerId);
            var fahrten = await query
                .OrderByDescending(f => f.Datum)
                .ThenByDescending(f => f.Startzeit)
                .ToListAsync();

            return Results.Ok(fahrten.Select(FahrtenMapper.ToDto));
        })
        .RequireAuthorization();

        app.MapGet("/api/v1/fahrten/{id:int}", async (
            int id,
            HttpContext httpContext,
            AppDbContext db
        ) =>
        {
            var ride = await db.Fahrten
                .Include(f => f.AngelegtVonUser)
                .Include(f => f.Teilnehmer)
                    .ThenInclude(tp => tp.Fahrgast)
                .Include(f => f.Teilnehmer)
                    .ThenInclude(tp => tp.Teilstrecken)
                        .ThenInclude(t => t.Fahrgast)
                .Include(f => f.Teilstrecken)
                    .ThenInclude(t => t.Fahrgast)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (ride is null)
            {
                return Results.NotFound("Fahrt wurde nicht gefunden.");
            }

            var access = await ValidateRideAccessAsync(httpContext.User, db, ride, allowDriverInitiativeRead: true);
            if (access is not null)
            {
                return access;
            }

            return Results.Ok(FahrtenMapper.ToDto(ride));
        })
        .RequireAuthorization();

        app.MapPost("/api/v1/fahrten", async (
            CreateFahrtRequest request,
            AppDbContext db,
            HttpContext httpContext
        ) =>
        {
            var validation = await ValidateRideWriteAsync(db, httpContext.User, request.Fahrt, request.Teilnehmer);
            if (validation is not null)
            {
                return validation;
            }

            await using var transaction = await db.Database.BeginTransactionAsync();
            try
            {
                var ride = await MaterializeRideAsync(db, httpContext.User, request);
                await transaction.CommitAsync();

                var loaded = await db.Fahrten
                    .Include(f => f.AngelegtVonUser)
                    .Include(f => f.Teilnehmer)
                        .ThenInclude(tp => tp.Fahrgast)
                    .Include(f => f.Teilnehmer)
                        .ThenInclude(tp => tp.Teilstrecken)
                            .ThenInclude(t => t.Fahrgast)
                    .Include(f => f.Teilstrecken)
                        .ThenInclude(t => t.Fahrgast)
                    .FirstAsync(f => f.Id == ride.Id);

                return Results.Ok(FahrtenMapper.ToDto(loaded));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return Results.Problem(ex.Message);
            }
        })
        .RequireAuthorization();

        app.MapPut("/api/v1/fahrten/{id:int}", async (
            int id,
            UpdateFahrtRequest request,
            AppDbContext db,
            HttpContext httpContext
        ) =>
        {
            var existing = await db.Fahrten
                .Include(f => f.Teilnehmer)
                    .ThenInclude(tp => tp.Teilstrecken)
                .Include(f => f.AngelegtVonUser)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (existing is null)
            {
                return Results.NotFound("Fahrt wurde nicht gefunden.");
            }

            var access = await ValidateRideAccessAsync(httpContext.User, db, existing, request.Fahrt.InitiativeId);
            if (access is not null)
            {
                return access;
            }

            var writeValidation = await ValidateRideWriteAsync(db, httpContext.User, request.Fahrt, request.Teilnehmer, id);
            if (writeValidation is not null)
            {
                return writeValidation;
            }

            await using var transaction = await db.Database.BeginTransactionAsync();
            try
            {
                db.Teilstrecken.RemoveRange(existing.Teilstrecken);
                db.FahrtTeilnehmer.RemoveRange(existing.Teilnehmer);
                await db.SaveChangesAsync();

                var updatedRide = await MaterializeRideAsync(db, httpContext.User, new CreateFahrtRequest(request.Fahrt, request.Teilnehmer), existing.Id);
                await transaction.CommitAsync();

                var loaded = await db.Fahrten
                    .Include(f => f.AngelegtVonUser)
                    .Include(f => f.Teilnehmer)
                        .ThenInclude(tp => tp.Fahrgast)
                    .Include(f => f.Teilnehmer)
                        .ThenInclude(tp => tp.Teilstrecken)
                            .ThenInclude(t => t.Fahrgast)
                    .Include(f => f.Teilstrecken)
                        .ThenInclude(t => t.Fahrgast)
                    .FirstAsync(f => f.Id == updatedRide.Id);

                return Results.Ok(FahrtenMapper.ToDto(loaded));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return Results.Problem(ex.Message);
            }
        })
        .RequireAuthorization();

        app.MapDelete("/api/v1/fahrten/{id:int}", async (
            int id,
            AppDbContext db,
            HttpContext httpContext
        ) =>
        {
            var ride = await db.Fahrten
                .Include(f => f.Teilnehmer)
                    .ThenInclude(tp => tp.Teilstrecken)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (ride is null)
            {
                return Results.NotFound("Fahrt wurde nicht gefunden.");
            }

            var access = await ValidateRideAccessAsync(httpContext.User, db, ride);
            if (access is not null)
            {
                return access;
            }

            db.Fahrten.Remove(ride);
            await db.SaveChangesAsync();

            return Results.Ok("Fahrt wurde gelöscht.");
        })
        .RequireAuthorization();

        app.MapPatch("/api/v1/fahrten/{id:int}/fahrer/{fahrerId:int}", async (int id, int fahrerId, AppDbContext db) =>
        {
            var fahrt = await db.Fahrten.FirstOrDefaultAsync(f => f.Id == id);
            if (fahrt is null)
                return Results.NotFound("Fahrt wurde nicht gefunden.");

            var fahrerExists = await db.Fahrer.AnyAsync(f => f.Id == fahrerId);
            if (!fahrerExists)
                return Results.NotFound("Fahrer wurde nicht gefunden.");

            fahrt.FahrerId = fahrerId;

            await db.SaveChangesAsync();

            return Results.Ok("Fahrer wurde zugewiesen.");
        })
        .RequireAuthorization();

        app.MapPatch("/api/v1/fahrten/{fahrtId:int}/fahrer/anmelden", async (
            int fahrtId,
            AppDbContext db,
            HttpContext httpContext) =>
        {
            var user = httpContext.User;
            var userId = AuthUtils.GetUserId(user);

            if (!userId.HasValue)
            {
                return Results.Unauthorized();
            }

            if (!user.IsInRole("Fahrer") && !AuthUtils.IsAdmin(user))
            {
                return Results.Forbid();
            }

            var fahrt = await db.Fahrten.FirstOrDefaultAsync(f => f.Id == fahrtId);
            if (fahrt is null)
            {
                return Results.NotFound("Fahrt wurde nicht gefunden.");
            }

            if (!AuthUtils.IsAdmin(user))
            {
                var initiativeId = AuthUtils.GetInitiativeId(user);
                if (!initiativeId.HasValue || initiativeId.Value != fahrt.InitiativeId)
                {
                    return Results.Forbid();
                }
            }

            var fahrer = await db.Fahrer
                .Include(f => f.Benutzer)
                .FirstOrDefaultAsync(f => f.BenutzerId == userId.Value);

            if (fahrer is null || !fahrer.Aktiv)
            {
                return Results.BadRequest("Angemeldeter Benutzer ist kein aktiver Fahrer.");
            }

            if (!AuthUtils.IsAdmin(user) && fahrer.Benutzer.InitiativeId != fahrt.InitiativeId)
            {
                return Results.Forbid();
            }

            fahrt.FahrerId = fahrer.Id;

            if (!string.Equals(fahrt.Status, "Abgeschlossen", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(fahrt.Status, "Completed", StringComparison.OrdinalIgnoreCase))
            {
                fahrt.Status = "Zugewiesen";
            }

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                fahrt.Id,
                fahrt.FahrerId,
                fahrt.Status
            });
        })
        .RequireAuthorization();

        app.MapPatch("/api/v1/fahrten/{fahrtId:int}/fahrer/abmelden", async (
            int fahrtId,
            AppDbContext db,
            HttpContext httpContext) =>
        {
            var user = httpContext.User;
            var userId = AuthUtils.GetUserId(user);

            if (!userId.HasValue)
            {
                return Results.Unauthorized();
            }

            if (!user.IsInRole("Fahrer") && !AuthUtils.IsAdmin(user))
            {
                return Results.Forbid();
            }

            var fahrt = await db.Fahrten.FirstOrDefaultAsync(f => f.Id == fahrtId);
            if (fahrt is null)
            {
                return Results.NotFound("Fahrt wurde nicht gefunden.");
            }

            if (!AuthUtils.IsAdmin(user))
            {
                var initiativeId = AuthUtils.GetInitiativeId(user);
                if (!initiativeId.HasValue || initiativeId.Value != fahrt.InitiativeId)
                {
                    return Results.Forbid();
                }

                var fahrerId = await db.Fahrer
                    .AsNoTracking()
                    .Where(f => f.BenutzerId == userId.Value)
                    .Select(f => (int?)f.Id)
                    .FirstOrDefaultAsync();

                if (!fahrerId.HasValue || fahrt.FahrerId != fahrerId.Value)
                {
                    return Results.Forbid();
                }
            }

            fahrt.FahrerId = null;

            if (!string.Equals(fahrt.Status, "Abgeschlossen", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(fahrt.Status, "Completed", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(fahrt.Fahrttyp, "Themenfahrt", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(fahrt.Fahrttyp, "theme", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(fahrt.Fahrttyp, "Vermietung", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(fahrt.Fahrttyp, "rental", StringComparison.OrdinalIgnoreCase))
            {
                fahrt.Status = "Offen";
            }

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                fahrt.Id,
                fahrt.FahrerId,
                fahrt.Status
            });
        })
        .RequireAuthorization();

        app.MapPatch("/api/v1/fahrten/{id:int}/fahrzeug/{fahrzeugId:int}", async (int id, int fahrzeugId, AppDbContext db) =>
        {
            var fahrt = await db.Fahrten.FirstOrDefaultAsync(f => f.Id == id);
            if (fahrt is null)
                return Results.NotFound("Fahrt wurde nicht gefunden.");

            var fahrzeugExists = await db.Fahrzeuge.AnyAsync(f => f.Id == fahrzeugId);
            if (!fahrzeugExists)
                return Results.NotFound("Fahrzeug wurde nicht gefunden.");

            fahrt.FahrzeugId = fahrzeugId;

            await db.SaveChangesAsync();

            return Results.Ok("Fahrzeug wurde zugewiesen.");
        })
        .RequireAuthorization();

        app.MapPatch("/api/v1/fahrtteilnehmer/{id:int}/abgehakt", async (
            int id,
            FahrtTeilnehmerCheckDto dto,
            AppDbContext db,
            HttpContext httpContext) =>
        {
            var teilnehmer = await db.FahrtTeilnehmer
                .Include(tp => tp.Fahrt)
                    .ThenInclude(f => f.Teilnehmer)
                .FirstOrDefaultAsync(tp => tp.Id == id);

            if (teilnehmer is null)
            {
                return Results.NotFound("Fahrtteilnehmer wurde nicht gefunden.");
            }

            var access = await ValidateRideAccessAsync(httpContext.User, db, teilnehmer.Fahrt);
            if (access is not null)
            {
                return access;
            }

            teilnehmer.IstAbgehakt = dto.IstAbgehakt;
            teilnehmer.AbgehaktAm = dto.IstAbgehakt ? DateTime.UtcNow : null;

            var alleAbgehakt = teilnehmer.Fahrt.Teilnehmer.All(tp =>
                tp.Id == teilnehmer.Id ? dto.IstAbgehakt : tp.IstAbgehakt);

            if (alleAbgehakt)
            {
                teilnehmer.Fahrt.Status = "Abgeschlossen";

                if (teilnehmer.Fahrt.Endzeit is null)
                {
                    teilnehmer.Fahrt.Endzeit = DateTime.UtcNow;
                }
            }
            else
            {
                teilnehmer.Fahrt.Status = "Offen";
                teilnehmer.Fahrt.Endzeit = null;
            }

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                teilnehmer.Id,
                teilnehmer.FahrtId,
                teilnehmer.IstAbgehakt,
                teilnehmer.AbgehaktAm,
                FahrtStatus = teilnehmer.Fahrt.Status,
                teilnehmer.Fahrt.Endzeit
            });
        })
        .RequireAuthorization();

        return app;
    }
}
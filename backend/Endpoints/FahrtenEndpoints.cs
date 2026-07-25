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

    private static bool IsStandardRide(string? rideType)
        => !string.IsNullOrWhiteSpace(rideType)
           && rideType.Contains("standard", StringComparison.OrdinalIgnoreCase);

    private static bool IsCancelledRideStatus(string? status)
        => !string.IsNullOrWhiteSpace(status)
           && (
               status.Contains("storniert", StringComparison.OrdinalIgnoreCase)
               || status.Contains("cancelled", StringComparison.OrdinalIgnoreCase)
               || status.Contains("canceled", StringComparison.OrdinalIgnoreCase)
               || status.Contains("gelöscht", StringComparison.OrdinalIgnoreCase)
               || status.Contains("deleted", StringComparison.OrdinalIgnoreCase)
           );

    private static bool IsSavedRideStatus(string? status)
        => string.Equals(status, "Gespeichert", StringComparison.OrdinalIgnoreCase)
           || string.Equals(status, "Saved", StringComparison.OrdinalIgnoreCase);

    private static bool IsDraft(string? status)
        => IsSavedRideStatus(status)
           || string.Equals(status, "Entwurf", StringComparison.OrdinalIgnoreCase)
           || string.Equals(status, "Draft", StringComparison.OrdinalIgnoreCase);

    private static bool IsVisibleToGuestOrDriver(Fahrten ride) => !IsDraft(ride.Status);

    private static bool IsDriverSelfAssignableRide(Fahrten ride)
        => IsThemeRide(ride.Fahrttyp) || IsStandardRide(ride.Fahrttyp);

    private static string ResolveWriteStatus(FahrtMetaDto meta)
    {
        if (IsSavedRideStatus(meta.Status))
        {
            return "Gespeichert";
        }

        if (IsRentalRide(meta.Fahrttyp))
        {
            return "Vermietung";
        }

        if (meta.FahrerId.HasValue)
        {
            return "Zugewiesen";
        }

        return IsThemeRide(meta.Fahrttyp) ? "Themenfahrt" : "Offen";
    }

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
        var isDriver = AuthUtils.IsFahrer(principal);
        var isGuest = AuthUtils.IsGast(principal);

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

        // Guests never receive detail records, even for a visible ride.
        if (isGuest)
        {
            return Results.Forbid();
        }

        if (isDriver && allowDriverInitiativeRead)
        {
            if (!IsVisibleToGuestOrDriver(ride))
            {
                return Results.Forbid();
            }

            return null;
        }

        if (isDriver && !IsVisibleToGuestOrDriver(ride))
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
        var isDriver = AuthUtils.IsFahrer(principal);
        var isGuest = AuthUtils.IsGast(principal);

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
            return query.Where(f => f.Status != "Gespeichert" && f.Status != "Saved" && f.Status != "Entwurf" && f.Status != "Draft");
        }

        if (isDriver)
        {
            return query.Where(f => f.Status != "Gespeichert" && f.Status != "Saved" && f.Status != "Entwurf" && f.Status != "Draft");
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
        ride.Status = ResolveWriteStatus(meta);
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
        RideTimeValidationService timeValidation,
        RideConflictService conflictService,
        int? ignoreRideId = null)
    {
        if (!AuthUtils.GetUserId(principal).HasValue)
            return Results.Unauthorized();

        if (!AuthUtils.CanManageRides(principal))
            return Results.Forbid();

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
        var isSaved = IsSavedRideStatus(meta.Status);

        var timeError = timeValidation.Validate(meta, teilnehmer, isSaved, isRental);
        if (timeError is not null)
            return Results.BadRequest(timeError);

        if (isSaved)
        {
            if (string.IsNullOrWhiteSpace(meta.Titel))
                return Results.BadRequest("Titel ist erforderlich.");

            if (!string.IsNullOrWhiteSpace(meta.Fahrttyp) &&
                !IsRentalRide(meta.Fahrttyp) &&
                !IsThemeRide(meta.Fahrttyp) &&
                !IsStandardRide(meta.Fahrttyp))
                return Results.BadRequest("Fahrttyp ist ungültig.");

            if (meta.FahrzeugId.HasValue)
            {
                var draftVehicle = await db.Fahrzeuge
                    .AsNoTracking()
                    .FirstOrDefaultAsync(f => f.Id == meta.FahrzeugId.Value);

                if (draftVehicle is null)
                    return Results.NotFound("Fahrzeug wurde nicht gefunden.");

                if (draftVehicle.InitiativeId != targetInitiativeId.Value)
                    return Results.Forbid();

                if (!draftVehicle.Aktiv)
                    return Results.BadRequest("Fahrzeug ist inaktiv.");
            }

            if (meta.FahrerId.HasValue)
            {
                var draftDriver = await db.Fahrer
                    .Include(f => f.Benutzer)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(f => f.Id == meta.FahrerId.Value);

                if (draftDriver is null)
                    return Results.BadRequest("Bitte Fahrer aus der Liste auswählen oder das Feld leer lassen.");

                if (draftDriver.Benutzer.InitiativeId != targetInitiativeId.Value)
                    return Results.BadRequest("Bitte Fahrer aus der Liste auswählen oder das Feld leer lassen.");

                if (!draftDriver.Aktiv)
                    return Results.BadRequest("Fahrer ist inaktiv.");
            }

            foreach (var participant in teilnehmer)
            {
                if (participant.FahrgastId.HasValue)
                {
                    var guest = await db.Fahrgaeste
                        .Include(f => f.Initiative)
                        .AsNoTracking()
                        .FirstOrDefaultAsync(f => f.Id == participant.FahrgastId.Value);

                    if (guest is null)
                        return Results.NotFound("Fahrgast wurde nicht gefunden.");

                    if (guest.InitiativeId != targetInitiativeId.Value)
                        return Results.BadRequest("Ein oder mehrere Fahrgäste gehören nicht zur Initiative dieser Fahrt.");
                }
            }

            return null;
        }

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

        if (!isRental && teilnehmer.Count > vehicle.Kapazitaet)
            return Results.BadRequest($"Das ausgewählte Fahrzeug bietet nur {vehicle.Kapazitaet} Fahrgastplätze.");

        var requestedFahrerId = meta.FahrerId;

        if (requestedFahrerId.HasValue)
        {
            var driver = await db.Fahrer
                .Include(f => f.Benutzer)
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == requestedFahrerId.Value);

            if (driver is null)
                return Results.BadRequest("Bitte Fahrer aus der Liste auswählen oder das Feld leer lassen.");

            if (driver.Benutzer.InitiativeId != targetInitiativeId.Value)
                return Results.BadRequest("Bitte Fahrer aus der Liste auswählen oder das Feld leer lassen.");

            if (!driver.Aktiv)
                return Results.BadRequest("Fahrer ist inaktiv.");
        }

        var conflictError = await conflictService.ValidateAsync(meta, targetInitiativeId.Value, ignoreRideId, isRental);
        if (conflictError is not null)
            return Results.Conflict(conflictError);

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
                    .Include(f => f.Initiative)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(f => f.Id == participant.FahrgastId.Value);

                if (guest is null)
                    return Results.NotFound("Fahrgast wurde nicht gefunden.");

                if (guest.InitiativeId != targetInitiativeId.Value)
                    return Results.BadRequest("Ein oder mehrere Fahrgäste gehören nicht zur Initiative dieser Fahrt.");
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
                .OrderBy(f => f.Datum)
                .ThenBy(f => f.Startzeit)
                .ThenBy(f => f.Id)
                .ToListAsync();

            // A guest needs only the calendar overview. Do not leak passengers,
            // remarks, creator information, or other protected ride details.
            var result = AuthUtils.IsGast(user)
                ? fahrten.Select(f => FahrtenMapper.ToDto(f) with
                {
                    Bemerkung = null,
                    AngelegtVonUserName = string.Empty,
                    Teilnehmer = []
                })
                : fahrten.Select(FahrtenMapper.ToDto);

            return Results.Ok(result);
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
                .AsNoTracking()
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
            HttpContext httpContext,
            TripEmailNotificationService tripEmailService,
            RideTimeValidationService timeValidation,
            RideConflictService conflictService
        ) =>
        {
            if (!AuthUtils.CanManageRides(httpContext.User))
            {
                return Results.Forbid();
            }

            var validation = await ValidateRideWriteAsync(db, httpContext.User, request.Fahrt, request.Teilnehmer, timeValidation, conflictService);
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

                // If a driver was assigned during creation, notify them
                if (request.Fahrt.FahrerId.HasValue && !IsSavedRideStatus(loaded.Status))
                {
                    var assignedDriver = await db.Fahrer
                        .Include(f => f.Benutzer)
                        .FirstOrDefaultAsync(f => f.Id == request.Fahrt.FahrerId.Value);

                    if (assignedDriver is not null)
                    {
                        try
                        {
                            await tripEmailService.SendTripDriverAssignedEmailAsync(loaded, assignedDriver, httpContext.User);
                        }
                        catch (Exception)
                        {
                            // Swallow to avoid breaking the primary operation
                        }
                    }
                }

                return Results.Ok(FahrtenMapper.ToDto(loaded));
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return Results.Problem("Fahrt konnte nicht gespeichert werden.");
            }
        })
        .RequireAuthorization();

        app.MapPut("/api/v1/fahrten/{id:int}", async (
            int id,
            UpdateFahrtRequest request,
            AppDbContext db,
            HttpContext httpContext,
            TripEmailNotificationService tripEmailService,
            RideTimeValidationService timeValidation,
            RideConflictService conflictService
        ) =>
        {
            if (!AuthUtils.CanManageRides(httpContext.User))
            {
                return Results.Forbid();
            }

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

            var writeValidation = await ValidateRideWriteAsync(db, httpContext.User, request.Fahrt, request.Teilnehmer, timeValidation, conflictService, id);
            if (writeValidation is not null)
            {
                return writeValidation;
            }

            // Capture old relevant values to decide whether to send change notifications
            var oldSnapshot = new
            {
                Fahrttyp = existing.Fahrttyp,
                Datum = existing.Datum,
                Startzeit = existing.Startzeit,
                Endzeit = existing.Endzeit,
                Zielort = existing.Zielort,
                FahrzeugId = existing.FahrzeugId,
                Status = existing.Status,
                Bemerkung = existing.Bemerkung,
                FahrerId = existing.FahrerId
            };

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

                // Determine relevant changes
                bool relevantChanged = !string.Equals(oldSnapshot.Fahrttyp, loaded.Fahrttyp, StringComparison.OrdinalIgnoreCase)
                    || oldSnapshot.Datum != loaded.Datum
                    || oldSnapshot.Startzeit != loaded.Startzeit
                    || oldSnapshot.Endzeit != loaded.Endzeit
                    || !string.Equals(oldSnapshot.Zielort, loaded.Zielort, StringComparison.OrdinalIgnoreCase)
                    || oldSnapshot.FahrzeugId != loaded.FahrzeugId
                    || !string.Equals(oldSnapshot.Status, loaded.Status, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(oldSnapshot.Bemerkung, loaded.Bemerkung, StringComparison.OrdinalIgnoreCase);

                try
                {
                    // If driver changed and new driver assigned -> send assigned email
                    if (oldSnapshot.FahrerId != loaded.FahrerId && loaded.FahrerId.HasValue && !IsSavedRideStatus(loaded.Status))
                    {
                        var newDriver = await db.Fahrer.Include(f => f.Benutzer).FirstOrDefaultAsync(f => f.Id == loaded.FahrerId.Value);
                        if (newDriver is not null)
                        {
                            await tripEmailService.SendTripDriverAssignedEmailAsync(loaded, newDriver, httpContext.User);
                        }
                    }
                    else if (loaded.FahrerId.HasValue && relevantChanged && !IsSavedRideStatus(loaded.Status))
                    {
                        var driver = await db.Fahrer.Include(f => f.Benutzer).FirstOrDefaultAsync(f => f.Id == loaded.FahrerId.Value);
                        if (driver is not null)
                        {
                            await tripEmailService.SendTripChangedEmailAsync(loaded, driver);
                        }
                    }
                }
                catch (Exception)
                {
                    // Do not fail the request if email notification fails
                }

                return Results.Ok(FahrtenMapper.ToDto(loaded));
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return Results.Problem("Fahrt konnte nicht gespeichert werden.");
            }
        })
        .RequireAuthorization();

        app.MapDelete("/api/v1/fahrten/{id:int}", async (
            int id,
            AppDbContext db,
            HttpContext httpContext
        ) =>
        {
            if (!AuthUtils.CanManageRides(httpContext.User))
            {
                return Results.Forbid();
            }

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

        app.MapPatch("/api/v1/fahrten/{id:int}/fahrer/{fahrerId:int}", async (int id, int fahrerId, AppDbContext db, HttpContext httpContext, TripEmailNotificationService tripEmailService) =>
        {
            if (!AuthUtils.CanManageRides(httpContext.User))
            {
                return Results.Forbid();
            }

            var fahrt = await db.Fahrten.FirstOrDefaultAsync(f => f.Id == id);
            if (fahrt is null)
                return Results.NotFound("Fahrt wurde nicht gefunden.");

            var access = await ValidateRideAccessAsync(httpContext.User, db, fahrt);
            if (access is not null)
            {
                return access;
            }

            var fahrer = await db.Fahrer
                .Include(f => f.Benutzer)
                .FirstOrDefaultAsync(f => f.Id == fahrerId);

            if (fahrer is null)
                return Results.BadRequest("Bitte Fahrer aus der Liste auswählen oder das Feld leer lassen.");

            if (fahrer.Benutzer.InitiativeId != fahrt.InitiativeId)
                return Results.BadRequest("Bitte Fahrer aus der Liste auswählen oder das Feld leer lassen.");

            if (!fahrer.Aktiv)
                return Results.BadRequest("Fahrer ist inaktiv.");

            var previous = fahrt.FahrerId;
            fahrt.FahrerId = fahrerId;
            fahrt.Status = "Zugewiesen";

            await db.SaveChangesAsync();

            // If assignment changed, notify new driver
            if (previous != fahrerId)
            {
                try
                {
                    await tripEmailService.SendTripDriverAssignedEmailAsync(fahrt, fahrer, httpContext.User);
                }
                catch (Exception)
                {
                    // swallow errors to keep behavior consistent
                }
            }

            return Results.Ok("Fahrer wurde zugewiesen.");
        })
        .RequireAuthorization();

        app.MapPatch("/api/v1/fahrten/{fahrtId:int}/fahrer/anmelden", async (
            int fahrtId,
            AppDbContext db,
            HttpContext httpContext,
            TripEmailNotificationService tripEmailService) =>
        {
            var user = httpContext.User;
            var userId = AuthUtils.GetUserId(user);

            if (!userId.HasValue)
            {
                return Results.Unauthorized();
            }

            if (!AuthUtils.IsFahrer(user))
            {
                return Results.Forbid();
            }

            var fahrt = await db.Fahrten.FirstOrDefaultAsync(f => f.Id == fahrtId);
            if (fahrt is null)
            {
                return Results.NotFound("Fahrt wurde nicht gefunden.");
            }

            var initiativeId = AuthUtils.GetInitiativeId(user);
            if (!initiativeId.HasValue || initiativeId.Value != fahrt.InitiativeId)
            {
                return Results.Forbid();
            }

            if (!IsDriverSelfAssignableRide(fahrt))
            {
                return Results.BadRequest("Fahrtart erlaubt keine Selbstanmeldung.");
            }

            if (string.Equals(fahrt.Status, "Abgeschlossen", StringComparison.OrdinalIgnoreCase)
                || string.Equals(fahrt.Status, "Completed", StringComparison.OrdinalIgnoreCase)
                || IsCancelledRideStatus(fahrt.Status))
            {
                return Results.BadRequest("Fahrt ist nicht mehr für Fahrerregistrierungen verfügbar.");
            }

            var fahrer = await db.Fahrer
                .Include(f => f.Benutzer)
                .FirstOrDefaultAsync(f => f.BenutzerId == userId.Value);

            if (fahrer is null || !fahrer.Aktiv)
            {
                return Results.BadRequest("Angemeldeter Benutzer ist kein aktiver Fahrer.");
            }

            if (fahrer.Benutzer.InitiativeId != fahrt.InitiativeId)
            {
                return Results.Forbid();
            }

            if (fahrt.FahrerId.HasValue)
            {
                return Results.BadRequest("Fahrt ist bereits einem Fahrer zugewiesen.");
            }

            var previousFahrerId = fahrt.FahrerId;

            fahrt.FahrerId = fahrer.Id;
            fahrt.Status = "Zugewiesen";

            await db.SaveChangesAsync();

            if (previousFahrerId != fahrer.Id)
            {
                try
                {
                    await tripEmailService.SendTripSelfRegistrationEmailAsync(fahrt, fahrer);
                }
                catch (Exception)
                {
                    // do not fail operation on email errors
                }
            }

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

            if (!AuthUtils.IsFahrer(user))
            {
                return Results.Forbid();
            }

            var fahrt = await db.Fahrten.FirstOrDefaultAsync(f => f.Id == fahrtId);
            if (fahrt is null)
            {
                return Results.NotFound("Fahrt wurde nicht gefunden.");
            }

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

            if (string.Equals(fahrt.Status, "Abgeschlossen", StringComparison.OrdinalIgnoreCase)
                || string.Equals(fahrt.Status, "Completed", StringComparison.OrdinalIgnoreCase)
                || IsCancelledRideStatus(fahrt.Status))
            {
                return Results.BadRequest("Fahrt kann nicht mehr abgemeldet werden.");
            }

            fahrt.FahrerId = null;

            fahrt.Status = IsThemeRide(fahrt.Fahrttyp) ? "Themenfahrt" : "Offen";

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                fahrt.Id,
                fahrt.FahrerId,
                fahrt.Status
            });
        })
        .RequireAuthorization();

        app.MapPatch("/api/v1/fahrten/{id:int}/fahrzeug/{fahrzeugId:int}", async (int id, int fahrzeugId, AppDbContext db, HttpContext httpContext) =>
        {
            if (!AuthUtils.CanManageRides(httpContext.User))
            {
                return Results.Forbid();
            }

            var fahrt = await db.Fahrten.FirstOrDefaultAsync(f => f.Id == id);
            if (fahrt is null)
                return Results.NotFound("Fahrt wurde nicht gefunden.");

            var access = await ValidateRideAccessAsync(httpContext.User, db, fahrt);
            if (access is not null)
            {
                return access;
            }

            var fahrzeug = await db.Fahrzeuge.AsNoTracking().FirstOrDefaultAsync(f => f.Id == fahrzeugId);
            if (fahrzeug is null)
                return Results.NotFound("Fahrzeug wurde nicht gefunden.");

            if (fahrzeug.InitiativeId != fahrt.InitiativeId)
                return Results.Forbid();

            if (!fahrzeug.Aktiv)
                return Results.BadRequest("Fahrzeug ist inaktiv.");

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

            var user = httpContext.User;
            var userId = AuthUtils.GetUserId(user);
            var isAdmin = AuthUtils.IsAdmin(user);
            var isDisponent = AuthUtils.IsDisponent(user);
            var isDriver = AuthUtils.IsFahrer(user);

            if (!isAdmin && !isDisponent && !isDriver)
            {
                return Results.Forbid();
            }

            var access = await ValidateRideAccessAsync(user, db, teilnehmer.Fahrt);
            if (access is not null)
            {
                return access;
            }

            if (isDriver)
            {
                var currentFahrerId = await ResolveFahrerIdAsync(db, userId);
                if (!currentFahrerId.HasValue || teilnehmer.Fahrt.FahrerId != currentFahrerId.Value)
                {
                    return Results.Forbid();
                }
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
                teilnehmer.Fahrt.Status = teilnehmer.Fahrt.FahrerId.HasValue
                    ? "Zugewiesen"
                    : IsThemeRide(teilnehmer.Fahrt.Fahrttyp)
                        ? "Themenfahrt"
                        : "Offen";
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

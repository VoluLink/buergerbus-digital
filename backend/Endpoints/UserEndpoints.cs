using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Mappers;
using BuergerbusAPI.Models;
using BuergerbusAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using System.Security.Claims;

/// <summary>
/// Enthält API-Endpunkte für Benutzerverwaltung,
/// Benutzerprofile und Rollenzuweisungen.
/// </summary>

namespace BuergerbusAPI.Endpoints;

public static class UserEndpoints
{
    /// <summary>
    /// Registriert alle Minimal-API-Endpunkte für Benutzer.
    /// Dazu gehören:
    /// - Benutzerliste
    /// - Einzelne Benutzer
    /// - Eigenes Profil
    /// - Profil bearbeiten
    /// - Rollen anzeigen und ändern
    /// </summary>
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        static bool CanManageUsers(ClaimsPrincipal principal)
            => AuthUtils.IsAdmin(principal) || principal.IsInRole("Disponent");

        static bool IsDisponentWithoutAdmin(ClaimsPrincipal principal)
            => !AuthUtils.IsAdmin(principal) && principal.IsInRole("Disponent");

// -----------------------------------------------------------------------------
// Benutzer anlegen (ohne Rechteprüfung; wird später ergänzt)
// -----------------------------------------------------------------------------
        app.MapPost("/api/v1/benutzer", async (
            CreateBenutzerRequest request,
            HttpContext httpContext,
            AppDbContext db,
            IPasswordHasher<Benutzer> passwordHasher,
            INotificationService notificationService,
            ILoggerFactory loggerFactory
        ) =>
        {
            var logger = loggerFactory.CreateLogger("UserEndpoints");
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var isDisponent = IsDisponentWithoutAdmin(principal);
            var requesterInitiativeId = AuthUtils.GetInitiativeId(principal);

            if (!CanManageUsers(principal))
            {
                return Results.Forbid();
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest("Name ist erforderlich.");
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return Results.BadRequest("E-Mail ist erforderlich.");
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return Results.BadRequest("Passwort ist erforderlich.");
            }

            if (request.RoleId <= 0)
            {
                return Results.BadRequest("Rolle ist erforderlich.");
            }

            if (request.InitiativeId <= 0)
            {
                return Results.BadRequest("Initiative ist erforderlich.");
            }

            var name = request.Name.Trim();
            var email = request.Email.Trim();

            try
            {
                _ = new MailAddress(email);
            }
            catch
            {
                return Results.BadRequest("E-Mail ist ungültig.");
            }

            if (request.Password.Trim().Length < 6)
            {
                return Results.BadRequest("Passwort muss mindestens 6 Zeichen lang sein.");
            }

            var normalizedEmail = email.ToLowerInvariant();
            var normalizedUsername = name.ToLowerInvariant();

            var emailExists = await db.Benutzer
                .AnyAsync(u => u.Email.ToLower() == normalizedEmail);
            if (emailExists)
            {
                return Results.BadRequest("E-Mail ist bereits vergeben.");
            }

            var usernameExists = await db.Benutzer
                .AnyAsync(u => u.Nutzername.ToLower() == normalizedUsername);
            if (usernameExists)
            {
                return Results.BadRequest("Name ist bereits vergeben.");
            }

            var initiative = await db.Initiativen
                .FirstOrDefaultAsync(i => i.Id == request.InitiativeId);
            if (initiative is null)
            {
                return Results.NotFound("Initiative wurde nicht gefunden.");
            }

            var role = await db.Rollen
                .FirstOrDefaultAsync(r => r.Id == request.RoleId);
            if (role is null)
            {
                return Results.NotFound("Rolle wurde nicht gefunden.");
            }

            if (isDisponent)
            {
                if (!requesterInitiativeId.HasValue)
                {
                    return Results.Forbid();
                }

                if (request.InitiativeId != requesterInitiativeId.Value)
                {
                    return Results.Forbid();
                }

                if (string.Equals(role.Rollenname, "Admin", StringComparison.OrdinalIgnoreCase))
                {
                    return Results.Forbid();
                }
            }

            await using var transaction = await db.Database.BeginTransactionAsync();

            var user = new Benutzer
            {
                Nutzername = name,
                Email = email,
                InitiativeId = initiative.Id,
                PasswortHash = "",
                Aktiv = true,
                AngelegtAm = DateTime.UtcNow,
                AktiveRolle = role.Rollenname,
            };

            user.PasswortHash = passwordHasher.HashPassword(user, request.Password);

            db.Benutzer.Add(user);
            await db.SaveChangesAsync();

            db.BenutzerRollen.Add(new BenutzerRolle
            {
                BenutzerId = user.Id,
                RolleId = role.Id,
            });

            if (string.Equals(role.Rollenname, "Fahrer", StringComparison.OrdinalIgnoreCase))
            {
                db.Fahrer.Add(new Fahrer
                {
                    BenutzerId = user.Id,
                    Aktiv = true,
                    AngelegtAm = DateTime.UtcNow,
                });
            }

            var inviteToken = PasswordResetTokenHelper.GenerateToken();
            db.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = PasswordResetTokenHelper.HashToken(inviteToken),
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                CreatedAt = DateTime.UtcNow,
            });

            await db.SaveChangesAsync();
            await transaction.CommitAsync();

            var loadedUser = await db.Benutzer
                .Include(u => u.Initiative)
                .Include(u => u.BenutzerRollen)
                    .ThenInclude(br => br.Rolle)
                .Include(u => u.Fahrer)
                .FirstOrDefaultAsync(u => u.Id == user.Id);

            if (loadedUser is null)
            {
                return Results.Problem("Benutzer wurde angelegt, konnte aber nicht geladen werden.");
            }

            try
            {
                await notificationService.SendUserCreatedEmailAsync(loadedUser, inviteToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Einladungs-E-Mail für Benutzer {UserId} konnte nicht versendet werden.", loadedUser.Id);
            }

            return Results.Created($"/api/v1/users/{loadedUser.Id}", UserMapper.CreateUserProfile(loadedUser));
        })
        .Accepts<CreateBenutzerRequest>("application/json")
        .Produces<UserProfileDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status404NotFound)
        .RequireAuthorization();

// -----------------------------------------------------------------------------
// Eigenes Benutzerprofil anhand von userId oder E-Mail laden
// -----------------------------------------------------------------------------
        app.MapGet("/api/v1/users/me", async (
            HttpContext httpContext,
            int? userId,
            string? email,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var tokenUserId = AuthUtils.GetUserId(principal);

            if (!isAdmin)
            {
                if (!tokenUserId.HasValue)
                {
                    return Results.Forbid();
                }

                if (userId.HasValue && userId.Value != tokenUserId.Value)
                {
                    return Results.Forbid();
                }

                // Non-admins can only load their own profile.
                userId = tokenUserId.Value;
                email = null;
            }
            else
            {
                if (userId is null && string.IsNullOrWhiteSpace(email))
                {
                    // For admins, default to own profile if nothing was provided.
                    userId = tokenUserId;
                }

                if (userId is null && string.IsNullOrWhiteSpace(email))
                {
                    return Results.BadRequest("userId oder email ist erforderlich.");
                }
            }

            var normalizedEmail = email?.Trim().ToLowerInvariant();

            var user = await db.Benutzer
                .Include(u => u.Initiative)
                .Include(u => u.BenutzerRollen)
                    .ThenInclude(br => br.Rolle)
                .Include(u => u.Fahrer)
                .FirstOrDefaultAsync(u =>
                    (userId.HasValue && u.Id == userId.Value)
                    || (!string.IsNullOrWhiteSpace(normalizedEmail) && u.Email.ToLower() == normalizedEmail));

            if (user is null)
            {
                return Results.NotFound("Benutzer wurde nicht gefunden.");
            }

            return Results.Ok(UserMapper.CreateUserProfile(user));
        })
        .RequireAuthorization();

// -----------------------------------------------------------------------------
// Paginierte Benutzerliste mit optionaler Suchfunktion
// -----------------------------------------------------------------------------
        app.MapGet("/api/v1/users", async (
            int page,
            int pageSize,
            string? search,
            HttpContext httpContext,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var isDisponent = IsDisponentWithoutAdmin(principal);
            var requesterInitiativeId = AuthUtils.GetInitiativeId(principal);

            if (!CanManageUsers(principal))
            {
                return Results.Forbid();
            }

            if (isDisponent && !requesterInitiativeId.HasValue)
            {
                return Results.Forbid();
            }

            page = Math.Max(1, page == 0 ? 1 : page);
            pageSize = Math.Clamp(pageSize == 0 ? 25 : pageSize, 1, 100);

            var query = db.Benutzer.AsNoTracking();

            if (isDisponent)
            {
                query = query.Where(b => b.InitiativeId == requesterInitiativeId!.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                query = query.Where(b =>
                    b.Nutzername.ToLower().Contains(term)
                    || b.Email.ToLower().Contains(term));
            }

            var totalItems = await query.CountAsync();

            var users = await query
                .OrderBy(b => b.Nutzername)
                .ThenBy(b => b.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(u => u.Initiative)
                .Include(u => u.BenutzerRollen)
                    .ThenInclude(br => br.Rolle)
                .Include(u => u.Fahrer)
                .ToListAsync();

            var items = users.Select(u =>
            {
                var roles = u.BenutzerRollen
                    .Select(br => br.Rolle?.Rollenname)
                    .Where(name => !string.IsNullOrWhiteSpace(name))
                    .Select(name => name!.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                return new UserSummaryDto(
                    u.Id,
                    u.Nutzername,
                    u.Email,
                    u.Initiative == null ? null : new InitiativeDto(u.Initiative.Id, u.Initiative.Name),
                    roles,
                    RolePriorityResolver.ResolveHighestRole(roles),
                    u.Fahrer == null ? null : u.Fahrer.Id,
                    u.Fahrer == null || u.Fahrer.Aktiv
                );
            }).ToList();

            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            return Results.Ok(new
            {
                items,
                page,
                pageSize,
                totalItems,
                totalPages,
            });
        })
        .RequireAuthorization();

// -----------------------------------------------------------------------------
// Einzelnen Benutzer anhand der ID laden
// -----------------------------------------------------------------------------
        app.MapGet("/api/v1/users/{id:int}", async (
            int id,
            HttpContext httpContext,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            if (!AuthUtils.IsAdmin(principal))
            {
                var tokenUserId = AuthUtils.GetUserId(principal);
                if (!tokenUserId.HasValue || tokenUserId.Value != id)
                {
                    return Results.Forbid();
                }
            }

            var user = await db.Benutzer
                .Include(u => u.Initiative)
                .Include(u => u.BenutzerRollen)
                    .ThenInclude(br => br.Rolle)
                .Include(u => u.Fahrer)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user is null)
            {
                return Results.NotFound("Benutzer wurde nicht gefunden.");
            }

            return Results.Ok(UserMapper.CreateUserProfile(user));
        })
        .RequireAuthorization();

// -----------------------------------------------------------------------------
// Vollständiges Benutzerprofil inklusive Rollen, Initiative und Fahrer laden
// -----------------------------------------------------------------------------
        app.MapGet("/api/v1/users/{id:int}/profile", async (
            int id,
            HttpContext httpContext,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            var tokenUserId = AuthUtils.GetUserId(principal);
            var isAdmin = AuthUtils.IsAdmin(principal);
            var isDisponent = principal.IsInRole("Disponent");
            var currentInitiativeId = AuthUtils.GetInitiativeId(principal);

            var user = await db.Benutzer
                .Include(u => u.Initiative)
                .Include(u => u.BenutzerRollen)
                    .ThenInclude(br => br.Rolle)
                .Include(u => u.Fahrer)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user is null)
            {
                return Results.NotFound("Benutzer wurde nicht gefunden.");
            }

            if (!isAdmin)
            {
                var isOwnProfile = tokenUserId.HasValue && tokenUserId.Value == id;
                var isSameInitiativeDisponent = isDisponent
                    && currentInitiativeId.HasValue
                    && user.InitiativeId == currentInitiativeId.Value;

                if (!isOwnProfile && !isSameInitiativeDisponent)
                {
                    return Results.Forbid();
                }
            }

            return Results.Ok(UserMapper.CreateUserProfile(user));
        })
        .RequireAuthorization();

// -----------------------------------------------------------------------------
// Benutzerprofil aktualisieren
// - Allgemeine Profildaten speichern
// - Nutzername validieren (nicht leer, eindeutig)
// - Führerschein- und G25-Daten speichern
// - Optional Fahrer-Daten aktualisieren
// -----------------------------------------------------------------------------
        app.MapPut("/api/v1/users/{id:int}/profile", async (
            int id,
            HttpContext httpContext,
            UpdateUserProfileRequest request,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            if (!AuthUtils.IsAdmin(principal))
            {
                var tokenUserId = AuthUtils.GetUserId(principal);
                if (!tokenUserId.HasValue || tokenUserId.Value != id)
                {
                    return Results.Forbid();
                }
            }

            var user = await db.Benutzer
                .Include(u => u.Initiative)
                .Include(u => u.BenutzerRollen)
                    .ThenInclude(br => br.Rolle)
                .Include(u => u.Fahrer)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user is null)
            {
                return Results.NotFound("Benutzer wurde nicht gefunden.");
            }
            // Benutzername prüfen und sicherstellen, dass er eindeutig ist
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return Results.BadRequest("Benutzername darf nicht leer sein.");
            }

            var normalizedUsername = request.Username.Trim().ToLowerInvariant();

            var usernameExists = await db.Benutzer.AnyAsync(b =>
                b.Id != id && b.Nutzername.ToLower() == normalizedUsername);

            if (usernameExists)
            {
                return Results.BadRequest("Benutzername ist bereits vergeben.");
            }
            // Allgemeine Profilfelder in das Benutzerobjekt übernehmen
            user.Vorname = request.Vorname;
            user.Nachname = request.Nachname;
            user.Nutzername = request.Username.Trim();
            user.Strasse = request.Strasse;
            user.Postleitzahl = request.Postleitzahl;
            user.Ort = request.Ort;
            user.Fuehrerscheinklasse = request.Fuehrerscheinklasse;
            user.LetzteG25 = request.LetzteG25;
            user.NaechsteG25 = request.NaechsteG25;
            user.Telefonnummer = request.Telefonnummer;
            user.Bemerkung = request.Bemerkung;
            user.Aktiv = request.Aktiv;
            user.GeaendertAm = DateTime.UtcNow;

            // Prüfen, ob der Benutzer die Rolle "Fahrer" besitzt
            var hasFahrerRole = user.BenutzerRollen.Any(br =>
                br.Rolle.Rollenname.ToLower() == "fahrer");

            if (request.Fahrer != null && hasFahrerRole)
            {
                if (user.Fahrer == null)
                {
                    // Falls notwendig, Fahrer-Datensatz automatisch anlegen
                    user.Fahrer = new Fahrer
                    {
                        BenutzerId = user.Id,
                        Aktiv = true,
                        AngelegtAm = DateTime.UtcNow
                    };
                }
                // Fahrerspezifische Zusatzdaten aktualisieren
                user.Fahrer.Bemerkung = request.Fahrer.Bemerkung;
                user.Fahrer.Aktiv = request.Fahrer.Aktiv;
                user.Fahrer.GeaendertAm = DateTime.UtcNow;
            }

            // Änderungen dauerhaft in der Datenbank speichern
            await db.SaveChangesAsync();

            return Results.Ok(UserMapper.CreateUserProfile(user));
        })
        .Accepts<UpdateUserProfileRequest>("application/json")
        .Produces<UserProfileDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequireAuthorization();

// -----------------------------------------------------------------------------
// Benutzerprofil löschen
// - Nur Admins dürfen fremde Profile löschen
// - Eigenes Profil darf nicht gelöscht werden
// - Von dem Benutzer angelegte Fahrten werden auf den ausführenden Admin umgehängt
// - Fahrer-Verknüpfungen werden vor dem Löschen gelöst
// -----------------------------------------------------------------------------
        app.MapDelete("/api/v1/users/{id:int}/profile", async (
            int id,
            HttpContext httpContext,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            if (!AuthUtils.IsAdmin(principal))
            {
                return Results.Forbid();
            }

            var requesterUserId = AuthUtils.GetUserId(principal);
            if (!requesterUserId.HasValue)
            {
                return Results.Forbid();
            }

            if (requesterUserId.Value == id)
            {
                return Results.BadRequest("Das eigene Profil kann nicht gelöscht werden.");
            }

            var user = await db.Benutzer
                .Include(u => u.Fahrer)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user is null)
            {
                return Results.NotFound("Benutzer wurde nicht gefunden.");
            }

            if (user.Fahrer is not null)
            {
                await db.Fahrten
                    .Where(f => f.FahrerId == user.Fahrer.Id)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(f => f.FahrerId, (int?)null));

                var fahrerFahrzeuge = await db.FahrerFahrzeuge
                    .Where(link => link.FahrerId == user.Fahrer.Id)
                    .ToListAsync();

                if (fahrerFahrzeuge.Count > 0)
                {
                    db.FahrerFahrzeuge.RemoveRange(fahrerFahrzeuge);
                }
            }

            await db.Fahrten
                .Where(f => f.AngelegtVonUserId == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(f => f.AngelegtVonUserId, requesterUserId.Value));

            db.Benutzer.Remove(user);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status404NotFound)
        .RequireAuthorization("AdminOnly");

// -----------------------------------------------------------------------------
// Rollen eines Benutzers anzeigen
// -----------------------------------------------------------------------------
        app.MapGet("/api/v1/users/{id:int}/roles", async (int id, AppDbContext db) =>
        {
            var user = await db.Benutzer
                .Include(u => u.BenutzerRollen)
                    .ThenInclude(br => br.Rolle)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user is null)
            {
                return Results.NotFound("Benutzer wurde nicht gefunden.");
            }

            var roles = user.BenutzerRollen
                .Select(br => br.Rolle.Rollenname)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct()
                .ToList();

            return Results.Ok(new UserRolesDto(
                id,
                roles,
                RolePriorityResolver.ResolveHighestRole(roles)));
        })
        .RequireAuthorization("AdminOnly");

// -----------------------------------------------------------------------------
// Rollen eines Benutzers aktualisieren
// - Neue Rollen automatisch anlegen
// - Nicht mehr vorhandene Rollen entfernen
// - Fahrer-Datensatz automatisch aktivieren/deaktivieren
// -----------------------------------------------------------------------------
        app.MapPut("/api/v1/users/{id:int}/roles", async (
            int id,
            UpdateRolesRequest request,
            HttpContext httpContext,
            AppDbContext db,
            JwtService jwtService
        ) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var isDisponent = IsDisponentWithoutAdmin(principal);
            var requesterInitiativeId = AuthUtils.GetInitiativeId(principal);

            if (!CanManageUsers(principal))
            {
                return Results.Forbid();
            }

            // Benutzer inklusive aktueller Rollen und optionalem Fahrer-Datensatz laden
            var user = await db.Benutzer
                .Include(u => u.BenutzerRollen)
                .ThenInclude(br => br.Rolle)
                .Include(u => u.Fahrer)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user is null)
            {
                return Results.NotFound("Benutzer wurde nicht gefunden.");
            }

            // Prüfen, ob überhaupt eine Rollenliste übergeben wurde
            if (request.Roles == null)
            {
                return Results.BadRequest("Rollenliste fehlt.");
            }
            
            // Rollen bereinigen: Leerzeichen entfernen, leere Einträge ignorieren
            var requestedRoles = request.Roles
                .Select(role => role?.Trim())
                .Where(role => !string.IsNullOrWhiteSpace(role))
                .ToList();

            // Rollen für Vergleiche normalisieren und Duplikate entfernen
            var normalizedRoles = requestedRoles
                .Select(role => role!.ToLowerInvariant())
                .Distinct()
                .ToList();

            if (isDisponent)
            {
                if (!requesterInitiativeId.HasValue || user.InitiativeId != requesterInitiativeId.Value)
                {
                    return Results.Forbid();
                }

                var userHasAdminRole = user.BenutzerRollen.Any(br =>
                    string.Equals(br.Rolle.Rollenname, "Admin", StringComparison.OrdinalIgnoreCase));

                if (userHasAdminRole || normalizedRoles.Contains("admin"))
                {
                    return Results.Forbid();
                }
            }

            if (normalizedRoles.Count > 2)
            {
                return Results.BadRequest("Ein Benutzer kann maximal zwei Rollen haben.");
            }

            if (normalizedRoles.Count < 1)
            {
                return Results.BadRequest("Ein Benutzer muss mindestens eine Rolle haben.");
            }

            // Bereits vorhandene Rollen aus der Datenbank laden
            var rolesByName = await db.Rollen
                .Where(r => normalizedRoles.Contains(r.Rollenname.ToLower()))
                .ToDictionaryAsync(r => r.Rollenname.ToLower(), r => r);
                
            // Noch nicht vorhandene Rollen automatisch erstellen
            foreach (var roleName in requestedRoles)
            {
                var normalizedRole = roleName!.ToLowerInvariant();
                if (rolesByName.ContainsKey(normalizedRole))
                {
                    continue;
                }

                var newRole = new Rollen { Rollenname = roleName };
                db.Rollen.Add(newRole);
                rolesByName[normalizedRole] = newRole;
            }
            // Neu erstellte Rollen speichern, damit ihre IDs verfügbar sind
            await db.SaveChangesAsync();

            // Rollen entfernen, die nicht mehr in der neuen Rollenliste enthalten sind
            user.BenutzerRollen.RemoveAll(br =>
                !normalizedRoles.Contains(br.Rolle.Rollenname.ToLowerInvariant()));

            // Neue Rollen dem Benutzer zuweisen
            foreach (var roleName in normalizedRoles)
            {
                var role = rolesByName[roleName];
                if (user.BenutzerRollen.Any(br => br.RolleId == role.Id))
                {
                    continue;
                }

                user.BenutzerRollen.Add(new BenutzerRolle
                {
                    BenutzerId = user.Id,
                    RolleId = role.Id,
                });
            }

            // Prüfen, ob Rolle "Fahrer" vorhanden ist
            var hasFahrerRole = normalizedRoles.Contains("fahrer");

            // Wenn die Rolle "Fahrer" neu vergeben wurde, Fahrer-Datensatz anlegen
            if (hasFahrerRole && user.Fahrer == null)
            {
                db.Fahrer.Add(new Fahrer
                {
                    BenutzerId = user.Id,
                    Aktiv = true,
                    AngelegtAm = DateTime.UtcNow
                });
            }

            // Wenn die Rolle "Fahrer" entfernt wurde, Fahrer-Datensatz deaktivieren
            if (!hasFahrerRole && user.Fahrer != null)
            {
                user.Fahrer.Aktiv = false;
                user.Fahrer.GeaendertAm = DateTime.UtcNow;
            }

            user.AktiveRolle = RolePriorityResolver.ResolveHighestRole(
                user.BenutzerRollen.Select(br => br.Rolle?.Rollenname));
            // Rollenänderungen und Fahrerstatus dauerhaft speichern
            await db.SaveChangesAsync();

            string? refreshedToken = null;
            var principalUserId = AuthUtils.GetUserId(httpContext.User);
            if (principalUserId.HasValue && principalUserId.Value == user.Id)
            {
                refreshedToken = jwtService.CreateToken(user);
            }

            return Results.Ok(new UserRolesDto(
                user.Id,
                user.BenutzerRollen
                    .Select(br => br.Rolle?.Rollenname)
                    .Where(name => !string.IsNullOrWhiteSpace(name))
                    .Select(name => name!)
                    .Distinct()
                    .ToList(),
                user.AktiveRolle,
                refreshedToken));
        })
            .RequireAuthorization();
        // Alle Benutzer-Endpunkte wurden registriert
        return app;
    }
}

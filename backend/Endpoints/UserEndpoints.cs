using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Mappers;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Enthält API-Endpunkte für Benutzerverwaltung,
/// Benutzerprofile und Rollenzuweisungen.
/// </summary>
namespace BuergerbusAPI.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/users/me", async (
            int? userId,
            string? email,
            AppDbContext db
        ) =>
        {
            if (userId is null && string.IsNullOrWhiteSpace(email))
            {
                return Results.BadRequest("userId oder email ist erforderlich.");
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
        });

        app.MapGet("/api/v1/users", async (
            int page,
            int pageSize,
            string? search,
            AppDbContext db
        ) =>
        {
            page = Math.Max(1, page == 0 ? 1 : page);
            pageSize = Math.Clamp(pageSize == 0 ? 25 : pageSize, 1, 100);

            var query = db.Benutzer.AsNoTracking();

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
        });

        app.MapGet("/api/v1/users/{id:int}", async (int id, AppDbContext db) =>
        {
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
        });

        app.MapGet("/api/v1/users/{id:int}/profile", async (int id, AppDbContext db) =>
        {
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
        });

        app.MapPut("/api/v1/users/{id:int}/profile", async (
            int id,
            UpdateUserProfileRequest request,
            AppDbContext db
        ) =>
        {
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

            user.Vorname = request.Vorname;
            user.Nachname = request.Nachname;
            user.Adresse = request.Adresse;
            user.Telefonnummer = request.Telefonnummer;
            user.Bemerkung = request.Bemerkung;
            user.Aktiv = request.Aktiv;
            user.GeaendertAm = DateTime.UtcNow;

            var hasFahrerRole = user.BenutzerRollen.Any(br =>
                br.Rolle.Rollenname.ToLower() == "fahrer");

            if (request.Fahrer != null && hasFahrerRole)
            {
                if (user.Fahrer == null)
                {
                    user.Fahrer = new Fahrer
                    {
                        BenutzerId = user.Id,
                        Aktiv = true,
                        AngelegtAm = DateTime.UtcNow
                    };
                }

                user.Fahrer.Fuehrerscheinklasse = request.Fahrer.Fuehrerscheinklasse;
                user.Fahrer.LetzteG25 = request.Fahrer.LetzteG25;
                user.Fahrer.NaechsteG25 = request.Fahrer.NaechsteG25;
                user.Fahrer.Bemerkung = request.Fahrer.Bemerkung;
                user.Fahrer.Aktiv = request.Fahrer.Aktiv;
                user.Fahrer.GeaendertAm = DateTime.UtcNow;
            }

            await db.SaveChangesAsync();

            return Results.Ok(UserMapper.CreateUserProfile(user));
        })
        .Accepts<UpdateUserProfileRequest>("application/json")
        .Produces<UserProfileDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

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

            return Results.Ok(new UserRolesDto(id, roles));
        });

        app.MapPut("/api/v1/users/{id:int}/roles", async (
            int id,
            UpdateRolesRequest request,
            AppDbContext db
        ) =>
        {
            var user = await db.Benutzer
                .Include(u => u.BenutzerRollen)
                    .ThenInclude(br => br.Rolle)
                .Include(u => u.Fahrer)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user is null)
            {
                return Results.NotFound("Benutzer wurde nicht gefunden.");
            }

            if (request.Roles == null)
            {
                return Results.BadRequest("Rollenliste fehlt.");
            }

            var requestedRoles = request.Roles
                .Select(role => role?.Trim())
                .Where(role => !string.IsNullOrWhiteSpace(role))
                .ToList();

            var normalizedRoles = requestedRoles
                .Select(role => role!.ToLowerInvariant())
                .Distinct()
                .ToList();

            var rolesByName = await db.Rollen
                .Where(r => normalizedRoles.Contains(r.Rollenname.ToLower()))
                .ToDictionaryAsync(r => r.Rollenname.ToLower(), r => r);

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

            await db.SaveChangesAsync();

            user.BenutzerRollen.RemoveAll(br =>
                !normalizedRoles.Contains(br.Rolle.Rollenname.ToLowerInvariant()));

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

            // Wenn Benutzer jetzt Fahrer ist, aber noch keinen Fahrer-Datensatz besitzt
            if (hasFahrerRole && user.Fahrer == null)
            {
                db.Fahrer.Add(new Fahrer
                {
                    BenutzerId = user.Id,
                    Aktiv = true,
                    AngelegtAm = DateTime.UtcNow
                });
            }

            // Wenn Rolle Fahrer entfernt wurde, Fahrer-Datensatz deaktivieren
            if (!hasFahrerRole && user.Fahrer != null)
            {
                user.Fahrer.Aktiv = false;
                user.Fahrer.GeaendertAm = DateTime.UtcNow;
            }

            await db.SaveChangesAsync();

            return Results.Ok(new UserRolesDto(
                user.Id,
                user.BenutzerRollen
                    .Select(br => br.Rolle.Rollenname)
                    .Distinct()
                    .ToList()));
        });

        return app;
    }
}

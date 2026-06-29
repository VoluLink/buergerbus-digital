using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using BuergerbusAPI.Services;
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
        static bool IsDisponentWithoutAdmin(HttpContext httpContext)
            => !AuthUtils.IsAdmin(httpContext.User) && httpContext.User.IsInRole("Disponent");

        static async Task<IResult> GetInitiativenDetails(AppDbContext db)
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
        }

        static async Task<IResult> CreateInitiative(CreateInitiativeRequest request, AppDbContext db)
        {
            var name = (request.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return Results.BadRequest("Name ist erforderlich.");
            }

            var nameExists = await db.Initiativen.AnyAsync(i => i.Name.ToLower() == name.ToLower());
            if (nameExists)
            {
                return Results.BadRequest("Eine Initiative mit diesem Namen existiert bereits.");
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
        }

        static async Task<IResult> UpdateInitiative(int id, UpdateInitiativeDetailsRequest request, AppDbContext db)
        {
            var entity = await db.Initiativen.FirstOrDefaultAsync(i => i.Id == id);
            if (entity is null)
            {
                return Results.NotFound("Initiative wurde nicht gefunden.");
            }

            var name = (request.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return Results.BadRequest("Name ist erforderlich.");
            }

            var nameExists = await db.Initiativen.AnyAsync(i => i.Id != id && i.Name.ToLower() == name.ToLower());
            if (nameExists)
            {
                return Results.BadRequest("Eine Initiative mit diesem Namen existiert bereits.");
            }

            var beschreibung = string.IsNullOrWhiteSpace(request.Beschreibung)
                ? null
                : request.Beschreibung!.Trim();

            entity.Name = name;
            entity.Beschreibung = beschreibung;
            entity.GeaendertAm = DateTime.UtcNow;

            await db.SaveChangesAsync();

            return Results.Ok(new InitiativeDetailsDto(
                entity.Id,
                entity.Name,
                entity.Beschreibung,
                entity.AngelegtAm,
                entity.GeaendertAm
            ));
        }

        static async Task<IResult> DeleteInitiative(int id, InitiativeDeletionService initiativeDeletionService)
        {
            var (ok, error) = await initiativeDeletionService.DeleteAsync(id);
            if (!ok)
            {
                return Results.Conflict(error ?? "Die Initiative konnte nicht gelöscht werden.");
            }

            return Results.NoContent();
        }

        static async Task<IResult> GetDeletePreview(int id, InitiativeDeletionService initiativeDeletionService)
        {
            var preview = await initiativeDeletionService.GetDeletePreviewAsync(id);
            if (preview is null)
            {
                return Results.NotFound("Initiative wurde nicht gefunden.");
            }

            return Results.Ok(preview);
        }

        app.MapGet("/api/v1/initiativen", GetInitiativenDetails).RequireAuthorization("AdminOnly");
        app.MapPost("/api/v1/initiativen", CreateInitiative).RequireAuthorization("AdminOnly");
        app.MapGet("/api/v1/initiativen/{id:int}/delete-preview", GetDeletePreview).RequireAuthorization("AdminOnly");
        app.MapPut("/api/v1/initiativen/{id:int}", UpdateInitiative).RequireAuthorization("AdminOnly");
        app.MapDelete("/api/v1/initiativen/{id:int}", DeleteInitiative).RequireAuthorization("AdminOnly");

        // Aliases (unversioned, english) as requested in the task description.
        app.MapGet("/api/initiatives", GetInitiativenDetails).RequireAuthorization("AdminOnly");
        app.MapPost("/api/initiatives", CreateInitiative).RequireAuthorization("AdminOnly");
        app.MapGet("/api/initiatives/{id:int}/delete-preview", GetDeletePreview).RequireAuthorization("AdminOnly");
        app.MapPut("/api/initiatives/{id:int}", UpdateInitiative).RequireAuthorization("AdminOnly");
        app.MapDelete("/api/initiatives/{id:int}", DeleteInitiative).RequireAuthorization("AdminOnly");

        app.MapGet("/api/v1/users/{id:int}/initiative", async (int id, HttpContext httpContext, AppDbContext db) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var isDisponent = IsDisponentWithoutAdmin(httpContext);
            var requesterInitiativeId = AuthUtils.GetInitiativeId(principal);

            if (!isAdmin && !isDisponent)
            {
                return Results.Forbid();
            }

            var user = await db.Benutzer
                .Include(u => u.Initiative)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user is null)
            {
                return Results.NotFound("Benutzer wurde nicht gefunden.");
            }

            if (isDisponent && (!requesterInitiativeId.HasValue || user.InitiativeId != requesterInitiativeId.Value))
            {
                return Results.Forbid();
            }

            if (user.Initiative == null)
            {
                return Results.Ok(null);
            }

            return Results.Ok(new InitiativeDto(user.Initiative.Id, user.Initiative.Name));
        })
        .RequireAuthorization();

        app.MapPut("/api/v1/users/{id:int}/initiative", async (
            int id,
            UpdateInitiativeRequest request,
            HttpContext httpContext,
            AppDbContext db
        ) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var isDisponent = IsDisponentWithoutAdmin(httpContext);
            var requesterInitiativeId = AuthUtils.GetInitiativeId(principal);

            if (!isAdmin && !isDisponent)
            {
                return Results.Forbid();
            }

            var user = await db.Benutzer.FirstOrDefaultAsync(u => u.Id == id);
            if (user is null)
            {
                return Results.NotFound("Benutzer wurde nicht gefunden.");
            }

            if (isDisponent)
            {
                if (!requesterInitiativeId.HasValue || user.InitiativeId != requesterInitiativeId.Value)
                {
                    return Results.Forbid();
                }

                if (request.InitiativeId != requesterInitiativeId.Value)
                {
                    return Results.Forbid();
                }
            }

            var initiative = await db.Initiativen.FirstOrDefaultAsync(i => i.Id == request.InitiativeId);
            if (initiative is null)
            {
                return Results.NotFound("Initiative wurde nicht gefunden.");
            }

            user.InitiativeId = initiative.Id;
            await db.SaveChangesAsync();

            return Results.Ok(new InitiativeDto(initiative.Id, initiative.Name));
        })
        .RequireAuthorization();

        app.MapGet("/api/v1/initiatives", async (HttpContext httpContext, AppDbContext db) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var isDisponent = IsDisponentWithoutAdmin(httpContext);
            var requesterInitiativeId = AuthUtils.GetInitiativeId(principal);

            if (!isAdmin && !isDisponent)
            {
                return Results.Forbid();
            }

            if (isDisponent && !requesterInitiativeId.HasValue)
            {
                return Results.Forbid();
            }

            var initiativesQuery = db.Initiativen.AsNoTracking();

            if (isDisponent)
            {
                initiativesQuery = initiativesQuery.Where(i => i.Id == requesterInitiativeId!.Value);
            }

            var initiatives = await initiativesQuery
                .AsNoTracking()
                .OrderBy(i => i.Name)
                .Select(i => new InitiativeDto(i.Id, i.Name))
                .ToListAsync();

            return Results.Ok(initiatives);
        })
        .RequireAuthorization();

        return app;
    }
}

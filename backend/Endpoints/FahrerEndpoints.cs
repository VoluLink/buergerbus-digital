using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace BuergerbusAPI.Endpoints;

/// <summary>
/// Enthält API-Endpunkte für Fahrer-spezifische Daten.
/// </summary>
public static class FahrerEndpoints
{
    public static IEndpointRouteBuilder MapFahrerEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/drivers", async (
            HttpContext httpContext,
            AppDbContext db,
            int? initiativeId
        ) =>
        {
            var principal = httpContext.User;
            var isAdmin = AuthUtils.IsAdmin(principal);
            var claimInitiativeId = AuthUtils.GetInitiativeId(principal);
            if (!isAdmin && !claimInitiativeId.HasValue)
            {
                return Results.Forbid();
            }

            // Admin is the documented global initiative-management role. All other
            // roles are limited to the initiative embedded in their signed token.
            if (!isAdmin && initiativeId.HasValue && initiativeId.Value != claimInitiativeId!.Value)
            {
                return Results.Forbid();
            }

            var targetInitiativeId = initiativeId ?? claimInitiativeId;
            if (!targetInitiativeId.HasValue)
            {
                return Results.BadRequest("Initiative ist erforderlich.");
            }

            var fahrerList = await db.Fahrer
                .AsNoTracking()
                .Include(f => f.Benutzer)
                .Where(f => f.Benutzer != null && f.Benutzer.InitiativeId == targetInitiativeId.Value)
                .OrderBy(f => f.Id)
                .ToListAsync();

            var dtos = fahrerList.Select(f =>
            {
                var nameParts = new[] { f.Benutzer?.Vorname, f.Benutzer?.Nachname }
                    .Where(part => !string.IsNullOrWhiteSpace(part))
                    .Select(part => part!.Trim());

                var displayName = string.Join(" ", nameParts);
                if (string.IsNullOrWhiteSpace(displayName))
                {
                    displayName = f.Benutzer?.Nutzername
                        ?? f.Benutzer?.Email
                        ?? "(Unbekannt)";
                }


                return new FahrerListItemDto(
                    f.Id,
                    f.BenutzerId,
                    displayName,
                    f.Benutzer?.Telefonnummer,
                    f.Aktiv ? "Aktiv" : "Inaktiv",
                    f.Aktiv,
                    f.Bemerkung
                );
            }).ToList();

            return Results.Ok(dtos);
        })
        .RequireAuthorization();

        return app;
    }
}

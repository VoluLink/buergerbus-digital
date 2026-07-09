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
        app.MapGet("/api/v1/fahrer", async (
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

            var fahrerList = await db.Fahrer
                .AsNoTracking()
                .Include(f => f.Benutzer)
                .Where(f => isAdmin || (f.Benutzer != null && f.Benutzer.InitiativeId == initiativeId))
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

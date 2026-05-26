using System.Security.Claims;
using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace BuergerbusAPI.Endpoints;

/// <summary>
/// Enthält API-Endpunkte für Fahrer-spezifische Daten.
/// </summary>
public static class FahrerEndpoints
{
    public static IEndpointRouteBuilder MapFahrerEndpoints(this IEndpointRouteBuilder app)
    {
        static async Task<IResult> GetMeAsync(HttpContext httpContext, AppDbContext db)
        {
            var userIdResult = TryGetUserId(httpContext.User);
            if (userIdResult.Error != null)
            {
                return userIdResult.Error;
            }

            if (!HasRole(httpContext.User, "Fahrer"))
            {
                return Results.Problem(
                    "Nur Benutzer mit der Rolle 'Fahrer' dürfen auf diese Daten zugreifen.",
                    statusCode: StatusCodes.Status403Forbidden
                );
            }

            var fahrer = await db.Fahrer
                .AsNoTracking()
                .Include(f => f.Benutzer)
                .Include(f => f.FahrerFahrzeuge)
                    .ThenInclude(ff => ff.Fahrzeug)
                .FirstOrDefaultAsync(f => f.BenutzerId == userIdResult.UserId);

            if (fahrer == null)
            {
                return Results.NotFound("Kein Fahrerprofil vorhanden.");
            }

            var nameParts = new[] { fahrer.Benutzer?.Vorname, fahrer.Benutzer?.Nachname }
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .Select(part => part!.Trim());

            var displayName = string.Join(" ", nameParts);
            if (string.IsNullOrWhiteSpace(displayName))
            {
                displayName = fahrer.Benutzer?.Nutzername
                    ?? fahrer.Benutzer?.Email
                    ?? "(Unbekannt)";
            }

            var fahrzeuge = fahrer.FahrerFahrzeuge
                .Select(ff => ff.Fahrzeug)
                .Where(fz => fz != null)
                .Select(fz =>
                {
                    var bezeichnung = fz!.Bezeichnung?.Trim();
                    var kennzeichen = fz.Kennzeichen?.Trim();

                    if (!string.IsNullOrWhiteSpace(bezeichnung) && !string.IsNullOrWhiteSpace(kennzeichen))
                    {
                        return $"{bezeichnung} ({kennzeichen})";
                    }

                    if (!string.IsNullOrWhiteSpace(bezeichnung))
                    {
                        return bezeichnung;
                    }

                    if (!string.IsNullOrWhiteSpace(kennzeichen))
                    {
                        return kennzeichen;
                    }

                    return string.Empty;
                })
                .Where(text => !string.IsNullOrWhiteSpace(text))
                .Select(text => text.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var dto = new FahrerMeDto(
                fahrer.Id,
                fahrer.BenutzerId,
                displayName,
                fahrer.Benutzer?.Telefonnummer,
                fahrer.Aktiv,
                fahrer.Aktiv ? "Aktiv" : "Inaktiv",
                fahrer.Bemerkung,
                fahrzeuge.FirstOrDefault(),
                fahrzeuge
            );

            return Results.Ok(dto);
        }

        app.MapGet("/api/v1/fahrer/me", GetMeAsync)
            .RequireAuthorization();

        // Alias wie in der Arbeitsanweisung (ohne /v1)
        app.MapGet("/api/fahrer/me", GetMeAsync)
            .RequireAuthorization();

        return app;
    }

    private static bool HasRole(ClaimsPrincipal user, string role)
    {
        return user.Claims.Any(c =>
            c.Type == ClaimTypes.Role
            && string.Equals(c.Value, role, StringComparison.OrdinalIgnoreCase));
    }

    private static (int UserId, IResult? Error) TryGetUserId(ClaimsPrincipal user)
    {
        var idText = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(idText) || !int.TryParse(idText, out var userId))
        {
            return (0, Results.Unauthorized());
        }

        return (userId, null);
    }
}

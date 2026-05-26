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
        app.MapGet("/api/v1/fahrer", async (AppDbContext db) =>
        {
            var fahrerList = await db.Fahrer
                .AsNoTracking()
                .Include(f => f.Benutzer)
                .Include(f => f.FahrerFahrzeuge)
                    .ThenInclude(ff => ff.Fahrzeug)
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

                var fahrzeugText = f.FahrerFahrzeuge
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
                    .FirstOrDefault(text => !string.IsNullOrWhiteSpace(text));

                fahrzeugText = string.IsNullOrWhiteSpace(fahrzeugText) ? null : fahrzeugText.Trim();

                return new FahrerListItemDto(
                    f.Id,
                    f.BenutzerId,
                    displayName,
                    f.Benutzer?.Telefonnummer,
                    fahrzeugText,
                    f.Aktiv ? "Aktiv" : "Inaktiv",
                    f.Aktiv,
                    f.Bemerkung
                );
            }).ToList();

            return Results.Ok(dtos);
        });

        return app;
    }
}

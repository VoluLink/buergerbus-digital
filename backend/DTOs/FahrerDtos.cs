namespace BuergerbusAPI.DTOs;

/// <summary>
/// DTOs für fahrerspezifische API-Endpunkte.
/// </summary>
public record FahrerMeDto(
    int FahrerId,
    int BenutzerId,
    string Name,
    string? Telefonnummer,
    bool Aktiv,
    string Status,
    string? Bemerkung,
    string? Fahrzeug,
    List<string> Fahrzeuge
);

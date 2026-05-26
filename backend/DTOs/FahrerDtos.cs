namespace BuergerbusAPI.DTOs;

/// <summary>
/// DTOs für Fahrer-Übersicht.
/// </summary>
public record FahrerListItemDto(
    int FahrerId,
    int BenutzerId,
    string Name,
    string? Telefonnummer,
    string? Fahrzeug,
    string Status,
    bool Aktiv,
    string? Bemerkung
);

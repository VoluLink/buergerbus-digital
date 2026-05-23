namespace BuergerbusAPI.DTOs;

/// <summary>
/// DTOs fuer Schaeden pro Fahrzeug.
/// </summary>
public record SchadenDto(
    int Id,
    int FahrzeugId,
    int InitiativeId,
    string Beschreibung,
    DateTime EntstandenAm,
    DateTime? BehobenAm,
    string Status
);

public record CreateSchadenRequest(
    string Beschreibung,
    DateTime EntstandenAm,
    DateTime? BehobenAm,
    string Status
);

public record UpdateSchadenRequest(
    string Beschreibung,
    DateTime EntstandenAm,
    DateTime? BehobenAm,
    string Status
);

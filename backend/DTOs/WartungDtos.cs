namespace BuergerbusAPI.DTOs;

/// <summary>
/// DTOs fuer Wartungen pro Fahrzeug.
/// </summary>
public record WartungDto(
    int Id,
    int FahrzeugId,
    int InitiativeId,
    DateTime LetzterTermin,
    DateTime? NaechsterTermin,
    string? Grund,
    string Ort,
    decimal? Kosten
);

public record CreateWartungRequest(
    DateTime LetzterTermin,
    DateTime? NaechsterTermin,
    string? Grund,
    string Ort,
    decimal? Kosten
);

public record UpdateWartungRequest(
    DateTime LetzterTermin,
    DateTime? NaechsterTermin,
    string? Grund,
    string Ort,
    decimal? Kosten
);

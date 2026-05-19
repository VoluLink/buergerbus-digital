namespace BuergerbusAPI.DTOs;

/// <summary>
/// DTOs fuer Fahrzeuge.
/// </summary>
public record FahrzeugDto(
    int Id,
    string Kennzeichen,
    string Bezeichnung,
    byte Kapazitaet,
    int Kilometerstand,
    DateTime Betriebsaufnahme,
    string? Bemerkung,
    string Status,
    bool Aktiv,
    int InitiativeId,
    string? InitiativeName,
    DateTime? LetzteWartung,
    DateTime? NaechsteWartung,
    int OffeneSchaeden
);

public record CreateFahrzeugRequest(
    string Kennzeichen,
    string Bezeichnung,
    byte Kapazitaet,
    int Kilometerstand,
    DateTime Betriebsaufnahme,
    string? Bemerkung,
    string? Status
);

public record UpdateFahrzeugRequest(
    string Kennzeichen,
    string Bezeichnung,
    byte Kapazitaet,
    int Kilometerstand,
    DateTime Betriebsaufnahme,
    string? Bemerkung,
    string? Status
);

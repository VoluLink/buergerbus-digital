namespace BuergerbusAPI.DTOs;
public record FahrgastDto(int Id,string Vorname,string Nachname,string Adresse,string? Email,string? Telefonnummer,string? Bemerkung,DateTime AngelegtAm,DateTime? GeaendertAm,DateTime? LetzteNutzung,bool Aktiv,int InitiativeId,string? InitiativeName);

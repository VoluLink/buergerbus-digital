namespace BuergerbusAPI.DTOs;
public record CreateFahrgastDto(string Vorname,string Nachname,string Adresse,string? Email,string? Telefonnummer,string? Bemerkung,DateTime? LetzteNutzung,bool Aktiv,int? InitiativeId);

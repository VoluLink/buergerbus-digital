namespace BuergerbusAPI.DTOs;
public record CreateFahrtTeilnehmerDto(int? FahrgastId,string Vorname,string Nachname,string? Adresse,string? Telefonnummer,bool AlsStammgastSpeichern,string Abholadresse,string Zieladresse,DateTime? Startzeit,DateTime? Endzeit,int? Reihenfolge,string? Status);

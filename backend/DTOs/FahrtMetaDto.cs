namespace BuergerbusAPI.DTOs;
public record FahrtMetaDto(string Titel,DateTime Datum,DateTime? DatumBis,string Zielort,string Fahrttyp,DateTime Startzeit,DateTime? Endzeit,string? Bemerkung,string Status,int? FahrerId,int? FahrzeugId,int? InitiativeId);

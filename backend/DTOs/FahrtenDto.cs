namespace BuergerbusAPI.DTOs;
public record FahrtenDto(int Id,string Titel,DateTime Datum,DateTime? DatumBis,string Zielort,string Fahrttyp,DateTime Startzeit,DateTime? Endzeit,string? Bemerkung,string Status,DateTime AngelegtAm,int AngelegtVonUserId,string AngelegtVonUserName,int? FahrerId,int? FahrzeugId,int InitiativeId,List<FahrtTeilnehmerDto> Teilnehmer);

namespace BuergerbusAPI.DTOs;
public record FahrtTeilnehmerDto(int Id,int FahrtId,int? FahrgastId,string Vorname,string Nachname,string? Adresse,string? Telefonnummer,bool IstAbgehakt,DateTime? AbgehaktAm,bool IstTemporaer,bool AlsStammgastGespeichert,List<TeilstreckeDto> Teilstrecken);

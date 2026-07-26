namespace BuergerbusAPI.DTOs;
public record UpdateFahrtRequest(FahrtMetaDto Fahrt,List<CreateFahrtTeilnehmerDto> Teilnehmer);

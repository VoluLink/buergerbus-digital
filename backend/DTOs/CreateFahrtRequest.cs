namespace BuergerbusAPI.DTOs;
public record CreateFahrtRequest(FahrtMetaDto Fahrt,List<CreateFahrtTeilnehmerDto> Teilnehmer);

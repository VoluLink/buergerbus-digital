namespace BuergerbusAPI.DTOs;
public record TeilstreckeDto(int Id,int FahrtTeilnehmerId,string Abholadresse,string Zieladresse,DateTime? Startzeit,DateTime? Endzeit,int? Reihenfolge,string? Status,int? FahrgastId,FahrgastDto? Fahrgast);

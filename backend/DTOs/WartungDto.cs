namespace BuergerbusAPI.DTOs;
public record WartungDto(int Id,int FahrzeugId,int InitiativeId,DateTime LetzterTermin,DateTime? NaechsterTermin,string? Grund,string Ort,decimal? Kosten);

namespace BuergerbusAPI.DTOs;
public record CreateWartungRequest(DateTime LetzterTermin,DateTime? NaechsterTermin,string? Grund,string Ort,decimal? Kosten);

namespace BuergerbusAPI.DTOs;
public record UpdateWartungRequest(DateTime LetzterTermin,DateTime? NaechsterTermin,string? Grund,string Ort,decimal? Kosten);

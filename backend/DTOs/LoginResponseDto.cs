namespace BuergerbusAPI.DTOs;
public record LoginResponseDto(bool Success, string Message, string Token, UserProfileDto User);

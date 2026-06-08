namespace BuergerbusAPI.DTOs;
/// <summary>
/// Enthält DTOs für Authentifizierung und Login.
/// Definiert Request- und Response-Modelle für den Login-Prozess.
/// </summary>
public record LoginRequest(string Email, string Password);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Token, string NewPassword);

public record LoginResponseDto(bool Success, string Message, string Token, UserProfileDto User);

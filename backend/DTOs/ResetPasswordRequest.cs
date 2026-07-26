namespace BuergerbusAPI.DTOs;
public record ResetPasswordRequest(string Token, string NewPassword);

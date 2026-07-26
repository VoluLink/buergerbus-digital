namespace BuergerbusAPI.DTOs; public record NotificationRecipientDto(Guid Id,int UserId,string Email,string DisplayName,string Status,string? ErrorMessage,DateTime? SentAt,DateTime CreatedAt);

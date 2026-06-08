namespace BuergerbusAPI.DTOs;

public record SendBroadcastNotificationRequest(
    string Subject,
    string Message,
    string Type,
    List<int>? InitiativeIds = null,
    List<string>? Roles = null,
    string? RecipientGroup = null,
    List<int>? RecipientUserIds = null
);

public record NotificationResultDto(
    Guid NotificationId,
    int SentCount,
    int FailedCount,
    string Status
);

public record NotificationSummaryDto(
    Guid Id,
    string Type,
    string Subject,
    string RecipientGroup,
    string Status,
    DateTime CreatedAt,
    DateTime? SentAt,
    int SentCount,
    int FailedCount
);

public record NotificationRecipientDto(
    Guid Id,
    int UserId,
    string Email,
    string DisplayName,
    string Status,
    string? ErrorMessage,
    DateTime? SentAt,
    DateTime CreatedAt
);

public record NotificationDetailsDto(
    Guid Id,
    string Type,
    string Subject,
    string Message,
    string RecipientGroup,
    string Status,
    int CreatedByUserId,
    DateTime CreatedAt,
    DateTime? SentAt,
    List<NotificationRecipientDto> Recipients
);
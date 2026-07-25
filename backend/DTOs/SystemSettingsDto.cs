namespace BuergerbusAPI.DTOs;
public sealed record SystemSettingsDto(int TemporaryParticipantRetentionDays, bool EnableDriverAssignmentEmails, bool EnableSelfRegistrationEmails, int DefaultRideDurationMinutes, bool ShowDashboardNotifications, int MaxEmailAttempts, int EmailHistoryRetentionDays, int MaxEmailsPerMinute, bool EnableEmailHistoryCleanup, DateTime UpdatedAtUtc);

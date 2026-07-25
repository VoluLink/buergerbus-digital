namespace BuergerbusAPI.DTOs;
public sealed record SystemSettingsDto(int TemporaryParticipantRetentionDays, bool EnableDriverAssignmentEmails, bool EnableSelfRegistrationEmails, int DefaultRideDurationMinutes, bool ShowDashboardNotifications, DateTime UpdatedAtUtc);

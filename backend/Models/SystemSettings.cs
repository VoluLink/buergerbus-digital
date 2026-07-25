namespace BuergerbusAPI.Models;

public class SystemSettings
{
    public int Id { get; set; }
    public int TemporaryParticipantRetentionDays { get; set; } = 7;
    public bool EnableDriverAssignmentEmails { get; set; } = true;
    public bool EnableSelfRegistrationEmails { get; set; } = true;
    public int DefaultRideDurationMinutes { get; set; } = 60;
    public bool ShowDashboardNotifications { get; set; } = true;
    public DateTime UpdatedAtUtc { get; set; }
    public int? UpdatedByUserId { get; set; }
}

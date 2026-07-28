namespace BuergerbusAPI.Models;

public class AdminNotification
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public AdminNotificationAudience Audience { get; set; }
    public int? InitiativeId { get; set; }
    public AdminNotificationPriority Priority { get; set; }
    public DateTime ValidFromUtc { get; set; }
    public DateTime? ValidUntilUtc { get; set; }
    public bool IsActive { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public int? UpdatedByUserId { get; set; }
}

namespace BuergerbusAPI.Models;

public class EmailOutbox
{
    public Guid Id { get; set; }
    public string EmailType { get; set; } = string.Empty;
    public string Recipient { get; set; } = string.Empty;
    public string? RecipientName { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public string? TemplateDataJson { get; set; }
    public string Status { get; set; } = "Pending";
    public int Attempts { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? SentAtUtc { get; set; }
    public DateTime? NextAttemptUtc { get; set; }
    public DateTime? ProcessingStartedAtUtc { get; set; }
    public string? LastError { get; set; }
    public Guid? NotificationId { get; set; }
    public Guid? NotificationRecipientId { get; set; }
    public int? InitiativeId { get; set; }
}

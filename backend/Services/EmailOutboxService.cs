using BuergerbusAPI.Data;
using BuergerbusAPI.Models;
using System.Text.Json;

namespace BuergerbusAPI.Services;

public sealed class EmailOutboxService(AppDbContext db, AuditService audit)
{
    public async Task<EmailOutbox> EnqueueAsync(string emailType, string recipient, string? recipientName, string subject, string htmlBody, Guid? notificationId = null, Guid? notificationRecipientId = null, int? initiativeId = null, CancellationToken ct = default)
    {
        var item = new EmailOutbox
        {
            Id = Guid.NewGuid(), EmailType = emailType, Recipient = recipient, RecipientName = recipientName,
            Subject = subject, TemplateName = "HtmlBody", TemplateDataJson = JsonSerializer.Serialize(new { htmlBody }),
            Status = "Pending", CreatedAtUtc = DateTime.UtcNow, NextAttemptUtc = DateTime.UtcNow,
            NotificationId = notificationId, NotificationRecipientId = notificationRecipientId, InitiativeId = initiativeId
        };
        db.EmailOutbox.Add(item);
        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("EMAIL_QUEUED", "EmailOutbox", "success", entityId: item.Id.ToString(), initiativeId: initiativeId, metadata: new { item.EmailType });
        return item;
    }
}

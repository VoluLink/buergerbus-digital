using BuergerbusAPI.Data;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace BuergerbusAPI.Services;

public sealed class EmailBackgroundWorker(IServiceScopeFactory scopeFactory, ILogger<EmailBackgroundWorker> logger) : BackgroundService
{
    private static readonly TimeSpan[] RetryDelays = [TimeSpan.Zero, TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(30), TimeSpan.FromHours(2)];

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await ProcessBatchAsync(stoppingToken); }
            catch (Exception ex) { logger.LogError(ex, "Fehler im E-Mail-Outbox-Worker."); }
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        }
    }

    private async Task ProcessBatchAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var settings = await scope.ServiceProvider.GetRequiredService<SystemSettingsService>().GetAsync(ct);
        var now = DateTime.UtcNow;
        var due = await db.EmailOutbox.Where(item => (item.Status == "Pending" && item.NextAttemptUtc <= now) || (item.Status == "Processing" && item.ProcessingStartedAtUtc < now.AddMinutes(-5)))
            .OrderBy(item => item.CreatedAtUtc).Take(Math.Clamp(settings.MaxEmailsPerMinute, 1, 500)).ToListAsync(ct);
        foreach (var item in due)
        {
            item.Status = "Processing"; item.ProcessingStartedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            await SendAsync(scope, item.Id, settings.MaxEmailAttempts, ct);
        }
        if (settings.EnableEmailHistoryCleanup)
        {
            var cutoff = now.AddDays(-settings.EmailHistoryRetentionDays);
            var expired = await db.EmailOutbox.Where(item => (item.Status == "Sent" || item.Status == "Failed" || item.Status == "Cancelled") && item.CreatedAtUtc < cutoff).ToListAsync(ct);
            if (expired.Count > 0) { db.EmailOutbox.RemoveRange(expired); await db.SaveChangesAsync(ct); }
        }
    }

    private static async Task SendAsync(IServiceScope scope, Guid id, int maxAttempts, CancellationToken ct)
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var email = await db.EmailOutbox.FirstAsync(item => item.Id == id, ct);
        var audit = scope.ServiceProvider.GetRequiredService<AuditService>();
        try
        {
            var document = JsonDocument.Parse(email.TemplateDataJson ?? "{}");
            var body = document.RootElement.TryGetProperty("htmlBody", out var html) ? html.GetString() : null;
            if (string.IsNullOrWhiteSpace(body)) throw new InvalidOperationException("E-Mail-Inhalt fehlt.");
            await scope.ServiceProvider.GetRequiredService<IEmailService>().SendEmailAsync(email.Recipient, email.Subject, body);
            email.Status = "Sent"; email.SentAtUtc = DateTime.UtcNow; email.LastError = null; email.TemplateDataJson = null; email.Recipient = MaskEmail(email.Recipient);
            await UpdateNotificationAsync(db, email, "Sent", ct);
            await db.SaveChangesAsync(ct);
            await audit.WriteAsync("EMAIL_SENT", "EmailOutbox", "success", entityId: email.Id.ToString(), initiativeId: email.InitiativeId, metadata: new { email.EmailType, email.Attempts });
        }
        catch (Exception ex)
        {
            scope.ServiceProvider.GetRequiredService<ILogger<EmailBackgroundWorker>>().LogWarning(ex, "E-Mail-Outbox-Eintrag {EmailId} konnte nicht versendet werden.", id);
            email.Attempts++;
            email.LastError = "SMTP-Versand fehlgeschlagen.";
            if (email.Attempts >= Math.Clamp(maxAttempts, 1, 5))
            {
                email.Status = "Failed"; email.TemplateDataJson = null; email.Recipient = MaskEmail(email.Recipient);
                await UpdateNotificationAsync(db, email, "Failed", ct);
                await db.SaveChangesAsync(ct);
                await audit.WriteAsync("EMAIL_FAILED", "EmailOutbox", "failure", entityId: email.Id.ToString(), initiativeId: email.InitiativeId, metadata: new { email.EmailType, email.Attempts });
            }
            else
            {
                email.Status = "Pending"; email.NextAttemptUtc = DateTime.UtcNow.Add(RetryDelays[Math.Min(email.Attempts, RetryDelays.Length - 1)]); email.ProcessingStartedAtUtc = null;
                await db.SaveChangesAsync(ct);
                await audit.WriteAsync("EMAIL_RETRY", "EmailOutbox", "retry", entityId: email.Id.ToString(), initiativeId: email.InitiativeId, metadata: new { email.EmailType, email.Attempts });
            }
        }
    }

    private static async Task UpdateNotificationAsync(AppDbContext db, EmailOutbox email, string recipientStatus, CancellationToken ct)
    {
        if (!email.NotificationId.HasValue || !email.NotificationRecipientId.HasValue) return;
        var recipient = await db.NotificationRecipients.FirstOrDefaultAsync(item => item.Id == email.NotificationRecipientId.Value, ct);
        if (recipient is null) return;
        recipient.Status = recipientStatus; recipient.SentAt = recipientStatus == "Sent" ? DateTime.UtcNow : null; recipient.ErrorMessage = recipientStatus == "Failed" ? "E-Mail konnte nicht versendet werden." : null; recipient.Email = MaskEmail(recipient.Email);
        var notification = await db.Notifications.Include(item => item.Recipients).FirstOrDefaultAsync(item => item.Id == email.NotificationId.Value, ct);
        if (notification is null) return;
        var statuses = notification.Recipients.Select(item => item.Status).ToList();
        notification.Status = statuses.All(item => item == "Sent") ? "Sent" : statuses.All(item => item == "Failed") ? "Failed" : statuses.Any(item => item == "Failed") ? "PartiallyFailed" : "Pending";
        if (statuses.All(item => item is "Sent" or "Failed")) notification.SentAt = DateTime.UtcNow;
    }

    private static string MaskEmail(string email) { var at = email.IndexOf('@'); return at <= 1 ? "***" : $"{email[0]}***{email[at..]}"; }
}

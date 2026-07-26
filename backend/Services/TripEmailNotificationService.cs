using BuergerbusAPI.Data;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BuergerbusAPI.Services;

public sealed class TripEmailNotificationService(AppDbContext db, IHttpContextAccessor httpContextAccessor, ILogger<TripEmailNotificationService> logger, SystemSettingsService settingsService, EmailOutboxService outbox, EmailTemplateService templates)
{
    private async Task QueueRenderedAsync(string type, RenderedEmail rendered, Benutzer user, int? initiativeId)
    {
        var creatorId = int.TryParse(httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
        var notification = new Notification { Id = Guid.NewGuid(), Type = type, Subject = rendered.Subject, Message = rendered.PlainText, CreatedByUserId = creatorId, CreatedAt = DateTime.UtcNow, Status = "Pending", RecipientGroup = "SingleUser" };
        var recipient = new NotificationRecipient { Id = Guid.NewGuid(), NotificationId = notification.Id, UserId = user.Id, Email = user.Email, DisplayName = user.Nutzername, Status = "Pending", CreatedAt = DateTime.UtcNow };
        notification.Recipients.Add(recipient);
        db.Notifications.Add(notification);
        await db.SaveChangesAsync();
        await outbox.EnqueueAsync(type, user.Email, user.Nutzername, rendered.Subject, rendered.Html, notification.Id, recipient.Id, initiativeId);
    }

    private async Task<Benutzer?> GetUserAsync(Fahrer fahrer) => await db.Benutzer.FirstOrDefaultAsync(user => user.Id == fahrer.BenutzerId);

    public async Task SendTripSelfRegistrationEmailAsync(Fahrten ride, Fahrer fahrer)
    {
        if (!(await settingsService.GetAsync()).EnableSelfRegistrationEmails) { logger.LogInformation("Selbstanmeldungs-E-Mail aufgrund der Systemeinstellung übersprungen."); return; }
        var user = await GetUserAsync(fahrer); if (user is null) return;
        var context = new SelfRegistrationTemplateContext(user.Nutzername ?? user.Vorname ?? "", ride.Datum.ToString("dd.MM.yyyy"), ride.Startzeit.ToString("HH:mm"), ride.Zielort ?? "nicht angegeben", ride.Initiative?.Name ?? "Bürgerbus");
        await QueueRenderedAsync("TripSelfRegistered", await templates.RenderAsync("TripSelfRegistered", context), user, ride.InitiativeId);
    }

    public async Task SendTripDriverAssignedEmailAsync(Fahrten ride, Fahrer fahrer, ClaimsPrincipal assignedBy)
    {
        if (!(await settingsService.GetAsync()).EnableDriverAssignmentEmails) { logger.LogInformation("Fahrerzuweisungs-E-Mail aufgrund der Systemeinstellung übersprungen."); return; }
        var user = await GetUserAsync(fahrer); if (user is null) return;
        var context = new DriverAssignmentTemplateContext(user.Nutzername ?? user.Vorname ?? "", ride.Datum.ToString("dd.MM.yyyy"), ride.Startzeit.ToString("HH:mm"), ride.Zielort ?? "nicht angegeben", ride.Initiative?.Name ?? "Bürgerbus");
        await QueueRenderedAsync("TripDriverAssigned", await templates.RenderAsync("TripDriverAssigned", context), user, ride.InitiativeId);
    }

    public async Task SendTripUpdatedEmailAsync(Fahrten ride, Fahrer fahrer, string changedFieldsSummary)
    {
        if (string.IsNullOrWhiteSpace(changedFieldsSummary)) return;
        var user = await GetUserAsync(fahrer); if (user is null) return;
        var context = new TripUpdatedTemplateContext(user.Nutzername ?? user.Vorname ?? "", ride.Datum.ToString("dd.MM.yyyy"), ride.Startzeit.ToString("HH:mm"), ride.Zielort ?? "nicht angegeben", ride.Initiative?.Name ?? "Bürgerbus", changedFieldsSummary);
        await QueueRenderedAsync("TripUpdated", await templates.RenderAsync("TripUpdated", context), user, ride.InitiativeId);
    }
}

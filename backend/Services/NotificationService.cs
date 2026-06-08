using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace BuergerbusAPI.Services;

public class NotificationService : INotificationService
{
    private const string StatusDraft = "Draft";
    private const string StatusSending = "Sending";
    private const string StatusSent = "Sent";
    private const string StatusPartiallyFailed = "PartiallyFailed";
    private const string StatusFailed = "Failed";

    private const string RecipientStatusPending = "Pending";
    private const string RecipientStatusSent = "Sent";
    private const string RecipientStatusFailed = "Failed";
    private const string RecipientStatusSkipped = "Skipped";

    private const string GroupAll = "All";
    private const string GroupAdmins = "Admins";
    private const string GroupDisponents = "Disponents";
    private const string GroupDrivers = "Drivers";

    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly EmailSettings _emailSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        AppDbContext db,
        IEmailService emailService,
        EmailSettings emailSettings,
        IHttpContextAccessor httpContextAccessor,
        ILogger<NotificationService> logger)
    {
        _db = db;
        _emailService = emailService;
        _emailSettings = emailSettings;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<NotificationResultDto> SendBroadcastAsync(SendBroadcastNotificationRequest request, string createdByUserId)
    {
        if (!int.TryParse(createdByUserId, out var creatorId) || creatorId <= 0)
        {
            throw new InvalidOperationException("Ungültiger Benutzer für die Benachrichtigung.");
        }

        var subject = request.Subject.Trim();
        var message = request.Message.Trim();
        var type = request.Type.Trim();
        var recipientGroup = NormalizeGroup(request.RecipientGroup);

        var recipients = await ResolveRecipientsAsync(recipientGroup, request.RecipientUserIds);
        if (recipients.Count == 0)
        {
            throw new InvalidOperationException("Keine Empfänger gefunden.");
        }

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            Type = type,
            Subject = subject,
            Message = message,
            CreatedByUserId = creatorId,
            CreatedAt = DateTime.UtcNow,
            Status = StatusSending,
            RecipientGroup = recipientGroup,
        };

        notification.Recipients = recipients.Select(recipient => new NotificationRecipient
        {
            Id = Guid.NewGuid(),
            NotificationId = notification.Id,
            UserId = recipient.Id,
            Email = recipient.Email,
            DisplayName = recipient.Nutzername,
            Status = RecipientStatusPending,
            CreatedAt = DateTime.UtcNow,
        }).ToList();

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        var sentCount = 0;
        var failedCount = 0;

        foreach (var recipient in notification.Recipients)
        {
            try
            {
                var htmlBody = BuildBroadcastHtml(notification, recipient);
                await _emailService.SendEmailAsync(recipient.Email, subject, htmlBody);

                recipient.Status = RecipientStatusSent;
                recipient.SentAt = DateTime.UtcNow;
                recipient.ErrorMessage = null;
                sentCount++;
            }
            catch (Exception ex)
            {
                recipient.Status = RecipientStatusFailed;
                recipient.ErrorMessage = "E-Mail konnte nicht versendet werden.";
                failedCount++;
                _logger.LogError(ex, "Fehler beim Versand der Benachrichtigung {NotificationId} an {RecipientEmail}.", notification.Id, recipient.Email);
            }

            await _db.SaveChangesAsync();
        }

        notification.SentAt = DateTime.UtcNow;
        notification.Status = failedCount == 0
            ? StatusSent
            : sentCount == 0
                ? StatusFailed
                : StatusPartiallyFailed;

        await _db.SaveChangesAsync();

        return new NotificationResultDto(notification.Id, sentCount, failedCount, notification.Status);
    }

    public async Task SendUserCreatedEmailAsync(Benutzer user, string inviteOrResetToken)
    {
        var creatorId = GetCurrentUserId();
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            Type = "UserCreated",
            Subject = "Dein Bürgerbus-Account wurde erstellt",
            Message = "Für dich wurde ein Benutzerkonto im Bürgerbus-System erstellt. Bitte setze über den folgenden Link dein Passwort.",
            CreatedByUserId = creatorId,
            CreatedAt = DateTime.UtcNow,
            Status = StatusSending,
            RecipientGroup = "SingleUser",
        };

        var recipient = new NotificationRecipient
        {
            Id = Guid.NewGuid(),
            NotificationId = notification.Id,
            UserId = user.Id,
            Email = user.Email,
            DisplayName = user.Nutzername,
            Status = RecipientStatusPending,
            CreatedAt = DateTime.UtcNow,
        };

        notification.Recipients.Add(recipient);
        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        try
        {
            var resetLink = PasswordResetTokenHelper.BuildResetLink(_emailSettings.FrontendUrl, inviteOrResetToken);
            var htmlBody = BuildUserCreatedHtml(user, resetLink);
            await _emailService.SendEmailAsync(user.Email, notification.Subject, htmlBody);

            recipient.Status = RecipientStatusSent;
            recipient.SentAt = DateTime.UtcNow;
            notification.Status = StatusSent;
        }
        catch (Exception ex)
        {
            recipient.Status = RecipientStatusFailed;
            recipient.ErrorMessage = "E-Mail konnte nicht versendet werden.";
            notification.Status = StatusFailed;
            _logger.LogError(ex, "Fehler beim Versand der Einladungs-E-Mail an {RecipientEmail}.", user.Email);
        }

        notification.SentAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<List<NotificationSummaryDto>> GetNotificationsAsync()
    {
        var notifications = await _db.Notifications
            .AsNoTracking()
            .Include(notification => notification.Recipients)
            .OrderByDescending(notification => notification.CreatedAt)
            .ToListAsync();

        return notifications.Select(MapSummary).ToList();
    }

    public async Task<NotificationDetailsDto> GetNotificationDetailsAsync(Guid notificationId)
    {
        var notification = await _db.Notifications
            .AsNoTracking()
            .Include(entry => entry.Recipients)
            .FirstOrDefaultAsync(entry => entry.Id == notificationId);

        if (notification is null)
        {
            throw new KeyNotFoundException("Benachrichtigung wurde nicht gefunden.");
        }

        return new NotificationDetailsDto(
            notification.Id,
            notification.Type,
            notification.Subject,
            notification.Message,
            notification.RecipientGroup,
            notification.Status,
            notification.CreatedByUserId,
            notification.CreatedAt,
            notification.SentAt,
            notification.Recipients
                .OrderBy(recipient => recipient.CreatedAt)
                .Select(recipient => new NotificationRecipientDto(
                    recipient.Id,
                    recipient.UserId,
                    recipient.Email,
                    recipient.DisplayName,
                    recipient.Status,
                    recipient.ErrorMessage,
                    recipient.SentAt,
                    recipient.CreatedAt))
                .ToList());
    }

    private async Task<List<Benutzer>> ResolveRecipientsAsync(string recipientGroup, List<int>? recipientUserIds)
    {
        var users = await _db.Benutzer
            .AsNoTracking()
            .Include(user => user.BenutzerRollen)
                .ThenInclude(userRole => userRole.Rolle)
            .Where(user => user.Aktiv)
            .ToListAsync();

        var filtered = recipientGroup switch
        {
            GroupAll => users,
            GroupAdmins => users.Where(user => HasRole(user, "Admin")).ToList(),
            GroupDisponents => users.Where(user => HasRole(user, "Disponent")).ToList(),
            GroupDrivers => users.Where(user => HasRole(user, "Fahrer")).ToList(),
            _ => throw new InvalidOperationException("Empfängergruppe ist ungültig.")
        };

        if (recipientUserIds is { Count: > 0 })
        {
            var selectedUsers = users.Where(user => recipientUserIds.Contains(user.Id)).ToList();
            filtered = filtered
                .Concat(selectedUsers)
                .GroupBy(user => user.Id)
                .Select(group => group.First())
                .ToList();
        }

        return filtered;
    }

    private static bool HasRole(Benutzer user, string roleName)
    {
        return user.BenutzerRollen.Any(userRole =>
            string.Equals(userRole.Rolle?.Rollenname, roleName, StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeGroup(string recipientGroup)
    {
        var normalized = recipientGroup.Trim();
        if (!string.Equals(normalized, GroupAll, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(normalized, GroupAdmins, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(normalized, GroupDisponents, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(normalized, GroupDrivers, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Empfängergruppe ist ungültig.");
        }

        return normalized switch
        {
            var value when string.Equals(value, GroupAll, StringComparison.OrdinalIgnoreCase) => GroupAll,
            var value when string.Equals(value, GroupAdmins, StringComparison.OrdinalIgnoreCase) => GroupAdmins,
            var value when string.Equals(value, GroupDisponents, StringComparison.OrdinalIgnoreCase) => GroupDisponents,
            var value when string.Equals(value, GroupDrivers, StringComparison.OrdinalIgnoreCase) => GroupDrivers,
            _ => GroupAll,
        };
    }

    private int GetCurrentUserId()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var userId = httpContext?.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userId, out var parsed) ? parsed : 0;
    }

    private static string BuildBroadcastHtml(Notification notification, NotificationRecipient recipient)
    {
        var heading = notification.Type switch
        {
            "SystemMaintenance" => "Geplante Wartung",
            "VehicleMaintenance" => "Fahrzeugwartung",
            _ => notification.Subject,
        };

        var body = WebUtility.HtmlEncode(notification.Message).Replace("\n", "<br />");
        return $@"<div style='font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;'>
  <h2>{WebUtility.HtmlEncode(heading)}</h2>
  <p>Hallo {WebUtility.HtmlEncode(recipient.DisplayName)},</p>
  <p>{body}</p>
  <p style='margin-top: 24px; font-size: 12px; color: #64748b;'>Dies ist eine automatische Nachricht des Bürgerbus-Systems.</p>
</div>";
    }

    private static string BuildUserCreatedHtml(Benutzer user, string resetLink)
    {
        return $@"<div style='font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;'>
  <h2>Dein Bürgerbus-Account wurde erstellt</h2>
  <p>Hallo {WebUtility.HtmlEncode(user.Nutzername)},</p>
  <p>Für dich wurde ein Benutzerkonto im Bürgerbus-System erstellt. Bitte setze über den folgenden Link dein Passwort.</p>
  <p><a href='{resetLink}'>Passwort jetzt setzen</a></p>
  <p style='margin-top: 24px; font-size: 12px; color: #64748b;'>Dies ist eine automatische Nachricht des Bürgerbus-Systems.</p>
</div>";
    }

    private static NotificationSummaryDto MapSummary(Notification notification)
    {
        var sentCount = notification.Recipients.Count(recipient => string.Equals(recipient.Status, RecipientStatusSent, StringComparison.OrdinalIgnoreCase));
        var failedCount = notification.Recipients.Count(recipient => string.Equals(recipient.Status, RecipientStatusFailed, StringComparison.OrdinalIgnoreCase));

        return new NotificationSummaryDto(
            notification.Id,
            notification.Type,
            notification.Subject,
            notification.RecipientGroup,
            notification.Status,
            notification.CreatedAt,
            notification.SentAt,
            sentCount,
            failedCount);
    }
}
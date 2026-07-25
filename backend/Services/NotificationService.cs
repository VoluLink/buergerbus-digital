using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace BuergerbusAPI.Services;

public class NotificationService : INotificationService
{
    private const string StatusDraft = "Draft";
    private const string StatusSending = "Pending";
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
    private const string RoleAdmin = "Admin";
    private const string RoleDisponent = "Disponent";
    private const string RoleDriver = "Fahrer";

    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly EmailSettings _emailSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<NotificationService> _logger;
    private readonly EmailOutboxService _outbox;
    private readonly EmailTemplateService _templates;

    public NotificationService(
        AppDbContext db,
        IEmailService emailService,
        EmailSettings emailSettings,
        IHttpContextAccessor httpContextAccessor,
        ILogger<NotificationService> logger,
        EmailOutboxService outbox,
        EmailTemplateService templates)
    {
        _db = db;
        _emailService = emailService;
        _emailSettings = emailSettings;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _outbox = outbox;
        _templates = templates;
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
        var initiativeIds = NormalizeInitiativeIds(request.InitiativeIds);
        var roles = NormalizeRoles(request.Roles, request.RecipientGroup);
        var recipientGroup = await BuildRecipientGroupLabelAsync(initiativeIds, roles, request.RecipientGroup);

        var recipients = await ResolveRecipientsAsync(initiativeIds, roles, request.RecipientUserIds);
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

        foreach (var recipient in notification.Recipients)
        {
            await _outbox.EnqueueAsync(type, recipient.Email, recipient.DisplayName, subject, BuildBroadcastHtml(notification, recipient), notification.Id, recipient.Id);
        }
        return new NotificationResultDto(notification.Id, 0, 0, notification.Status);
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

        var resetLink = PasswordResetTokenHelper.BuildResetLink(_emailSettings.FrontendUrl, inviteOrResetToken);
        var rendered = await _templates.RenderAsync("UserCreated", new InvitationTemplateContext(user.Nutzername, resetLink));
        notification.Subject = rendered.Subject;
        await _db.SaveChangesAsync();
        await _outbox.EnqueueAsync("UserCreated", user.Email, user.Nutzername, rendered.Subject, rendered.Html, notification.Id, recipient.Id);
    }

    public async Task<PagedNotificationResultDto> GetNotificationsAsync(int page, int pageSize, string? status, string? type, DateTime? fromUtc)
    {
        page = Math.Max(page, 1); pageSize = pageSize is 50 or 100 ? pageSize : 25;
        var query = _db.Notifications.AsNoTracking().Include(notification => notification.Recipients).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(item => item.Status == status);
        if (!string.IsNullOrWhiteSpace(type)) query = query.Where(item => item.Type == type);
        if (fromUtc.HasValue) query = query.Where(item => item.CreatedAt >= fromUtc.Value);
        var total = await query.CountAsync();
        var notifications = await query.OrderByDescending(notification => notification.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedNotificationResultDto(notifications.Select(MapSummary).ToList(), page, pageSize, total);
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
                    MaskEmail(recipient.Email),
                    recipient.DisplayName,
                    recipient.Status,
                    recipient.ErrorMessage,
                    recipient.SentAt,
                    recipient.CreatedAt))
                .ToList());
    }

    private async Task<List<Benutzer>> ResolveRecipientsAsync(List<int> initiativeIds, List<string> roles, List<int>? recipientUserIds)
    {
        var users = await _db.Benutzer
            .AsNoTracking()
            .Include(user => user.Initiative)
            .Include(user => user.BenutzerRollen)
                .ThenInclude(userRole => userRole.Rolle)
            .Where(user => user.Aktiv)
            .ToListAsync();

        var filtered = users.AsEnumerable();

        if (initiativeIds.Count > 0)
        {
            filtered = filtered.Where(user => initiativeIds.Contains(user.InitiativeId));
        }

        if (roles.Count > 0)
        {
            filtered = filtered.Where(user => roles.Any(role => HasRole(user, role)));
        }

        if (recipientUserIds is { Count: > 0 })
        {
            var selectedUsers = users.Where(user => recipientUserIds.Contains(user.Id)).ToList();
            filtered = filtered
                .Concat(selectedUsers)
                .GroupBy(user => user.Id)
                .Select(group => group.First())
                .ToList();
        }

        return filtered.ToList();
    }

    private static bool HasRole(Benutzer user, string roleName)
    {
        return user.BenutzerRollen.Any(userRole =>
            string.Equals(userRole.Rolle?.Rollenname, roleName, StringComparison.OrdinalIgnoreCase));
    }

    private static List<int> NormalizeInitiativeIds(List<int>? initiativeIds)
    {
        return initiativeIds is { Count: > 0 }
            ? initiativeIds.Where(id => id > 0).Distinct().ToList()
            : new List<int>();
    }

    private static List<string> NormalizeRoles(List<string>? roles, string? legacyRecipientGroup)
    {
        var normalizedRoles = (roles ?? new List<string>())
            .Select(NormalizeRole)
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalizedRoles.Count > 0)
        {
            return normalizedRoles;
        }

        if (string.IsNullOrWhiteSpace(legacyRecipientGroup))
        {
            return normalizedRoles;
        }

        return NormalizeLegacyGroupToRoles(legacyRecipientGroup);
    }

    private static string NormalizeRole(string roleName)
    {
        var normalized = roleName.Trim();

        return normalized.ToLowerInvariant() switch
        {
            "admin" or "admins" => RoleAdmin,
            "disponent" or "disponenten" or "disponents" => RoleDisponent,
            "fahrer" or "drivers" => RoleDriver,
            _ => throw new InvalidOperationException("Rolle ist ungültig."),
        };
    }

    private static List<string> NormalizeLegacyGroupToRoles(string legacyRecipientGroup)
    {
        var normalized = legacyRecipientGroup.Trim();

        if (string.Equals(normalized, GroupAll, StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>();
        }

        if (string.Equals(normalized, GroupAdmins, StringComparison.OrdinalIgnoreCase))
        {
            return new List<string> { RoleAdmin };
        }

        if (string.Equals(normalized, GroupDisponents, StringComparison.OrdinalIgnoreCase))
        {
            return new List<string> { RoleDisponent };
        }

        if (string.Equals(normalized, GroupDrivers, StringComparison.OrdinalIgnoreCase))
        {
            return new List<string> { RoleDriver };
        }

        throw new InvalidOperationException("Empfängergruppe ist ungültig.");
    }

    private async Task<string> BuildRecipientGroupLabelAsync(List<int> initiativeIds, List<string> roles, string? legacyRecipientGroup)
    {
        var initiativeLabel = initiativeIds.Count == 0
            ? "Alle Initiativen"
            : string.Join(", ", await _db.Initiativen
                .AsNoTracking()
                .Where(initiative => initiativeIds.Contains(initiative.Id))
                .OrderBy(initiative => initiative.Name)
                .Select(initiative => initiative.Name)
                .ToListAsync());

        var roleLabel = roles.Count == 0
            ? "Alle Rollen"
            : string.Join(", ", roles.Select(GetRoleLabel));

        if (initiativeIds.Count == 0 && roles.Count == 0 && !string.IsNullOrWhiteSpace(legacyRecipientGroup))
        {
            return $"Filter: Initiative {initiativeLabel}, Rolle {GetLegacyGroupLabel(legacyRecipientGroup)}";
        }

        return $"Filter: Initiative {initiativeLabel}, Rolle {roleLabel}";
    }

    private static string GetRoleLabel(string roleName)
    {
        return roleName switch
        {
            RoleAdmin => "Admins",
            RoleDisponent => "Disponenten",
            RoleDriver => "Fahrer",
            _ => roleName,
        };
    }

    private static string GetLegacyGroupLabel(string recipientGroup)
    {
        return recipientGroup.Trim() switch
        {
            var value when string.Equals(value, GroupAll, StringComparison.OrdinalIgnoreCase) => "Alle Rollen",
            var value when string.Equals(value, GroupAdmins, StringComparison.OrdinalIgnoreCase) => "Admins",
            var value when string.Equals(value, GroupDisponents, StringComparison.OrdinalIgnoreCase) => "Disponenten",
            var value when string.Equals(value, GroupDrivers, StringComparison.OrdinalIgnoreCase) => "Fahrer",
            _ => recipientGroup.Trim(),
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

    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 1) return "***";
        return $"{email[0]}***{email[at..]}";
    }
}

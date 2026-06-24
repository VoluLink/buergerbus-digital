using BuergerbusAPI.Data;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Security.Claims;

namespace BuergerbusAPI.Services;

public class TripEmailNotificationService
{
    private const string StatusSending = "Sending";
    private const string StatusSent = "Sent";
    private const string StatusFailed = "Failed";

    private const string RecipientStatusPending = "Pending";
    private const string RecipientStatusSent = "Sent";
    private const string RecipientStatusFailed = "Failed";

    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly EmailSettings _emailSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<TripEmailNotificationService> _logger;

    public TripEmailNotificationService(
        AppDbContext db,
        IEmailService emailService,
        EmailSettings emailSettings,
        IHttpContextAccessor httpContextAccessor,
        ILogger<TripEmailNotificationService> logger)
    {
        _db = db;
        _emailService = emailService;
        _emailSettings = emailSettings;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var userId = httpContext?.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userId, out var parsed) ? parsed : 0;
    }

    private string BuildTripHtml(Fahrten ride, string recipientName, string intro)
    {
        var fahrttypRaw = ride.Fahrttyp?.Trim() ?? string.Empty;
        var fahrttypKey = fahrttypRaw.ToLowerInvariant();

        var fahrttypAnzeige = fahrttypKey switch
        {
            "standard" => "Standardfahrt",
            "standardfahrt" => "Standardfahrt",
            "theme" => "Themenfahrt",
            "thema" => "Themenfahrt",
            "themenfahrt" => "Themenfahrt",
            "vermietung" => "Vermietung",
            _ => string.IsNullOrWhiteSpace(fahrttypRaw) ? "nicht angegeben" : fahrttypRaw
        };

        var isThemenfahrt = fahrttypKey is "theme" or "thema" or "themenfahrt";

        var fahrttyp = WebUtility.HtmlEncode(fahrttypAnzeige);
        var datum = ride.Datum.ToString("dd.MM.yyyy");
        var uhrzeit = ride.Startzeit.ToString("HH:mm") + (ride.Endzeit.HasValue ? " - " + ride.Endzeit.Value.ToString("HH:mm") : string.Empty);
        var themaSection = isThemenfahrt && !string.IsNullOrWhiteSpace(ride.Titel)
            ? $"Thema: {WebUtility.HtmlEncode(ride.Titel)}<br />\n  "
            : string.Empty;
        var zielSection = isThemenfahrt && !string.IsNullOrWhiteSpace(ride.Zielort)
            ? $"Ziel: {WebUtility.HtmlEncode(ride.Zielort)}<br />\n  "
            : string.Empty;
        var fahrzeug = "nicht angegeben";

        if (ride.FahrzeugId.HasValue)
        {
            var vehicle = _db.Fahrzeuge
                .AsNoTracking()
                .FirstOrDefault(v => v.Id == ride.FahrzeugId.Value);

            if (vehicle != null)
            {
                var bezeichnung = string.IsNullOrWhiteSpace(vehicle.Bezeichnung)
                    ? "Fahrzeug"
                    : vehicle.Bezeichnung;

                var kennzeichen = string.IsNullOrWhiteSpace(vehicle.Kennzeichen)
                    ? string.Empty
                    : $" ({vehicle.Kennzeichen})";

                fahrzeug = $"{bezeichnung}{kennzeichen}";
            }
        }

        var anzahl = ride.Teilnehmer?.Count ?? _db.FahrtTeilnehmer.AsNoTracking().Count(tp => tp.FahrtId == ride.Id);

        var frontendUrl = _emailSettings.FrontendUrl;

        var urlSection = string.IsNullOrWhiteSpace(frontendUrl)
            ? string.Empty
            : $"<p>Bürgerbus-System:<br />{WebUtility.HtmlEncode(frontendUrl)}</p>";

        return $@"<div style='font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;'>
  <p>Hallo {WebUtility.HtmlEncode(recipientName)},</p>
  <p>{WebUtility.HtmlEncode(intro)}</p>
  <h3>Fahrt:</h3>
  <p>Fahrtart: {fahrttyp}<br />
    {themaSection}{zielSection}
  Datum: {datum}<br />
  Uhrzeit: {WebUtility.HtmlEncode(uhrzeit)}<br />
    Fahrzeug: {WebUtility.HtmlEncode(fahrzeug)}<br />
  Anzahl Fahrgäste: {anzahl}</p>
  <p>Details findest du nach dem Login im Bürgerbus-System.</p>
  {urlSection}
  <p style='margin-top: 24px; font-size: 12px; color: #64748b;'>Viele Grüße<br/>Bürgerbus Digital</p>
</div>";
    }

    private async Task SendNotificationAsync(string type, string subject, string message, Benutzer user)
    {
        var creatorId = GetCurrentUserId();
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            Type = type,
            Subject = subject,
            Message = message,
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
            var htmlBody = message; // caller will pass already formatted HTML
            await _emailService.SendEmailAsync(user.Email, subject, htmlBody);

            recipient.Status = RecipientStatusSent;
            recipient.SentAt = DateTime.UtcNow;
            notification.Status = StatusSent;
        }
        catch (Exception ex)
        {
            recipient.Status = RecipientStatusFailed;
            recipient.ErrorMessage = "E-Mail konnte nicht versendet werden.";
            notification.Status = StatusFailed;
            _logger.LogError(ex, "Fehler beim Versand der Fahrt-E-Mail an {RecipientEmail}.", user.Email);
        }

        notification.SentAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task SendTripSelfRegistrationEmailAsync(Fahrten ride, Fahrer fahrer)
    {
        if (ride is null || fahrer is null) return;

        var user = await _db.Benutzer.FirstOrDefaultAsync(u => u.Id == fahrer.BenutzerId);
        if (user is null) return;

        var intro = "du hast dich erfolgreich für eine Fahrt angemeldet.";
        var html = BuildTripHtml(ride, user.Nutzername ?? user.Vorname ?? "", intro);
        await SendNotificationAsync("TripSelfRegistered", "Anmeldung zur Fahrt bestätigt", html, user);
    }

    public async Task SendTripDriverAssignedEmailAsync(Fahrten ride, Fahrer fahrer, ClaimsPrincipal assignedBy)
    {
        if (ride is null || fahrer is null) return;

        var user = await _db.Benutzer.FirstOrDefaultAsync(u => u.Id == fahrer.BenutzerId);
        if (user is null) return;

        string intro;
        if (AuthUtils.IsAdmin(assignedBy))
            intro = "du wurdest von einem Admin für eine Fahrt eingetragen.";
        else if (assignedBy.IsInRole("Disponent"))
            intro = "du wurdest von einem Disponenten für eine Fahrt eingetragen.";
        else
            intro = "du wurdest durch das Bürgerbus-Team für eine Fahrt eingetragen.";

        var html = BuildTripHtml(ride, user.Nutzername ?? user.Vorname ?? "", intro);
        await SendNotificationAsync("TripDriverAssigned", "Du wurdest einer Fahrt zugewiesen", html, user);
    }

    public async Task SendTripChangedEmailAsync(Fahrten ride, Fahrer fahrer)
    {
        if (ride is null || fahrer is null) return;

        var user = await _db.Benutzer.FirstOrDefaultAsync(u => u.Id == fahrer.BenutzerId);
        if (user is null) return;

        var intro = "eine deiner eingetragenen Fahrten wurde geändert.";
        var html = BuildTripHtml(ride, user.Nutzername ?? user.Vorname ?? "", intro);
        await SendNotificationAsync("TripChanged", "Eine deiner Fahrten wurde geändert", html, user);
    }
}

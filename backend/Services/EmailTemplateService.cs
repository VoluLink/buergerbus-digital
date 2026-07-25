using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.RegularExpressions;

namespace BuergerbusAPI.Services;

public sealed record DriverAssignmentTemplateContext(string DriverName, string RideDate, string RideTime, string Destination, string InitiativeName);
public sealed record SelfRegistrationTemplateContext(string DriverName, string RideDate, string RideTime, string Destination, string InitiativeName);
public sealed record TripUpdatedTemplateContext(string RecipientName, string RideDate, string RideTime, string Destination, string InitiativeName, string ChangedFieldsSummary);
public sealed record InvitationTemplateContext(string UserName, string ResetLink);
public sealed record PasswordResetTemplateContext(string UserName, string ResetLink, string ExpirationMinutes, string InitiativeName, string SupportContact);
public sealed record RenderedEmail(string Subject, string Html, string PlainText);
public sealed record EmailTemplateDefinition(string Type, string DisplayName, string Description, string[] AllowedPlaceholders, string[] RequiredPlaceholders, EmailTemplateDto DefaultTemplate);

public sealed class EmailTemplateService(AppDbContext db, ILogger<EmailTemplateService> logger)
{
    public static readonly IReadOnlyList<EmailTemplateDefinition> Definitions =
    [
        Definition("TripDriverAssigned", "Fahrerzuweisung", "Wird bei einer neuen Fahrerzuweisung versendet.", ["DriverName", "RideDate", "RideTime", "Destination", "InitiativeName"], [], "Neue Fahrt am {{RideDate}}", "Neue Fahrt zugewiesen", "Hallo {{DriverName}},", "dir wurde eine neue Fahrt zugewiesen. Datum: {{RideDate}}\nUhrzeit: {{RideTime}}\nZiel: {{Destination}}", "Details findest du nach dem Login."),
        Definition("TripUpdated", "Fahrt geändert", "Informiert den zugewiesenen Fahrer über relevante Änderungen einer Fahrt.", ["RecipientName", "RideDate", "RideTime", "Destination", "InitiativeName", "ChangedFieldsSummary"], ["ChangedFieldsSummary"], "Deine Fahrt am {{RideDate}} wurde geändert", "Fahrt geändert", "Hallo {{RecipientName}},", "eine deiner eingetragenen Fahrten wurde geändert.\n\n{{ChangedFieldsSummary}}\n\nAktuell: {{RideDate}}, {{RideTime}}, Ziel: {{Destination}}", "Details findest du nach dem Login."),
        Definition("TripSelfRegistered", "Selbstanmeldung", "Bestätigt die Anmeldung zu einer Fahrt.", ["DriverName", "RideDate", "RideTime", "Destination", "InitiativeName"], [], "Anmeldung zur Fahrt bestätigt", "Anmeldung bestätigt", "Hallo {{DriverName}},", "du hast dich erfolgreich für die Fahrt am {{RideDate}} um {{RideTime}} angemeldet.", "Details findest du nach dem Login."),
        Definition("UserCreated", "Account-Einladung", "Enthält den Link zur Kontoaktivierung.", ["UserName", "ResetLink"], ["ResetLink"], "Dein Bürgerbus-Account wurde erstellt", "Willkommen", "Hallo {{UserName}},", "für dich wurde ein Benutzerkonto erstellt. Bitte setze dein Passwort über {{ResetLink}}.", "Bewahre den Link sicher auf und teile ihn nicht mit anderen."),
        Definition("PasswordReset", "Passwort zurücksetzen", "Enthält den zeitlich begrenzten Reset-Link.", ["UserName", "ResetLink", "ExpirationMinutes", "InitiativeName", "SupportContact"], ["ResetLink", "ExpirationMinutes"], "Passwort zurücksetzen", "Passwort zurücksetzen", "Hallo {{UserName}},", "du hast eine Zurücksetzung deines Passworts angefordert. Verwende dafür innerhalb von {{ExpirationMinutes}} Minuten diesen Link: {{ResetLink}}", "Falls du das nicht angefordert hast, kannst du diese E-Mail ignorieren.")
    ];

    public static IReadOnlyList<string> Types => Definitions.Select(x => x.Type).ToList();

    public static EmailTemplateDefinition GetDefinition(string type) => Definitions.FirstOrDefault(x => x.Type == type) ?? throw new InvalidOperationException("Unbekannter Template-Typ.");

    public async Task<EmailTemplateDto> GetAsync(string type, CancellationToken ct = default)
    {
        var saved = await db.EmailTemplates.AsNoTracking().SingleOrDefaultAsync(x => x.TemplateType == type, ct);
        return saved is null ? Default(type) : Dto(saved);
    }

    public async Task<RenderedEmail> RenderAsync(string type, object context, CancellationToken ct = default)
    {
        var values = Values(context);
        var template = await GetAsync(type, ct);
        try
        {
            return Render(template, values);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Template {Type} konnte nicht gerendert werden; Standard wird verwendet.", type);
            return Render(Default(type), values);
        }
    }

    public static EmailTemplateDto Default(string type) => GetDefinition(type).DefaultTemplate;

    public static object SampleContext(string type) => type switch
    {
        "TripDriverAssigned" => new DriverAssignmentTemplateContext("Max Mustermann", "17.07.2026", "13:30", "Musterstadt", "Bürgerbus Musterstadt"),
        "TripUpdated" => new TripUpdatedTemplateContext("Max Mustermann", "17.07.2026", "13:30", "Musterstadt", "Bürgerbus Musterstadt", "Datum: 16.07.2026 → 17.07.2026\nStartzeit: 12:30 → 13:30"),
        "TripSelfRegistered" => new SelfRegistrationTemplateContext("Max Mustermann", "17.07.2026", "13:30", "Musterstadt", "Bürgerbus Musterstadt"),
        "UserCreated" => new InvitationTemplateContext("Max Mustermann", "https://example.invalid/reset-password?token=test-token"),
        "PasswordReset" => new PasswordResetTemplateContext("Max Mustermann", "https://example.invalid/reset-password?token=test-token", "60", "Bürgerbus Musterstadt", "Bürgerbus-Team"),
        _ => throw new InvalidOperationException("Unbekannter Template-Typ.")
    };

    private static EmailTemplateDefinition Definition(string type, string displayName, string description, string[] allowed, string[] required, string subject, string heading, string intro, string body, string closing) =>
        new(type, displayName, description, allowed, required, new EmailTemplateDto(0, type, subject, heading, intro, body, closing, "Ihr Bürgerbus-Team", "Diese Nachricht wurde automatisch erstellt.", DateTime.MinValue));

    private static RenderedEmail Render(EmailTemplateDto template, Dictionary<string, string> values)
    {
        string Replace(string value) => Regex.Replace(value, @"\{\{\s*([^} ]+)\s*\}\}", match => values.TryGetValue(match.Groups[1].Value, out var replacement) ? replacement : match.Value);
        var subject = Replace(template.Subject);
        var text = string.Join("\n\n", new[] { Replace(template.Heading), Replace(template.Intro), Replace(template.Body), Replace(template.Closing), Replace(template.Signature), Replace(template.Footer) }.Where(value => !string.IsNullOrWhiteSpace(value)));
        var html = $"<div style='font-family:Arial,sans-serif;line-height:1.6;color:#0f172a'><h2>{WebUtility.HtmlEncode(Replace(template.Heading))}</h2>{string.Join("", new[] { template.Intro, template.Body, template.Closing, template.Signature, template.Footer }.Where(value => !string.IsNullOrWhiteSpace(value)).Select(value => $"<p>{WebUtility.HtmlEncode(Replace(value)).Replace("\n", "<br />")}</p>"))}</div>";
        return new RenderedEmail(subject, html, text);
    }

    private static Dictionary<string, string> Values(object context) => context switch
    {
        DriverAssignmentTemplateContext item => new() { ["DriverName"] = item.DriverName, ["RideDate"] = item.RideDate, ["RideTime"] = item.RideTime, ["Destination"] = item.Destination, ["InitiativeName"] = item.InitiativeName },
        SelfRegistrationTemplateContext item => new() { ["DriverName"] = item.DriverName, ["RideDate"] = item.RideDate, ["RideTime"] = item.RideTime, ["Destination"] = item.Destination, ["InitiativeName"] = item.InitiativeName },
        TripUpdatedTemplateContext item => new() { ["RecipientName"] = item.RecipientName, ["RideDate"] = item.RideDate, ["RideTime"] = item.RideTime, ["Destination"] = item.Destination, ["InitiativeName"] = item.InitiativeName, ["ChangedFieldsSummary"] = item.ChangedFieldsSummary },
        InvitationTemplateContext item => new() { ["UserName"] = item.UserName, ["ResetLink"] = item.ResetLink },
        PasswordResetTemplateContext item => new() { ["UserName"] = item.UserName, ["ResetLink"] = item.ResetLink, ["ExpirationMinutes"] = item.ExpirationMinutes, ["InitiativeName"] = item.InitiativeName, ["SupportContact"] = item.SupportContact },
        _ => throw new InvalidOperationException("Ungültiger Template-Kontext.")
    };

    private static EmailTemplateDto Dto(Models.EmailTemplate item) => new(item.Id, item.TemplateType, item.Subject, item.Heading, item.Intro, item.Body, item.Closing, item.Signature, item.Footer, item.UpdatedAtUtc);
}

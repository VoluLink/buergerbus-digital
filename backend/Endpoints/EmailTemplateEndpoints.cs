using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using BuergerbusAPI.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace BuergerbusAPI.Endpoints;

public static class EmailTemplateEndpoints
{
    public static IEndpointRouteBuilder MapEmailTemplateEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/admin/email/templates", async (EmailTemplateService templates, CancellationToken ct) =>
        {
            var items = new List<EmailTemplateAdminDto>();
            foreach (var definition in EmailTemplateService.Definitions)
            {
                var template = await templates.GetAsync(definition.Type, ct);
                items.Add(ToAdminDto(template, definition));
            }
            return Results.Ok(items);
        }).RequireAuthorization("AdminOnly");

        app.MapPut("/api/v1/admin/email/templates/{type}", async (string type, EmailTemplateDto request, HttpContext context, AppDbContext db, AuditService audit, CancellationToken ct) =>
        {
            EmailTemplateDefinition definition;
            try { definition = EmailTemplateService.GetDefinition(type); }
            catch (InvalidOperationException) { return Results.BadRequest("Unbekannter Template-Typ."); }
            if (!Valid(request, definition, out var error)) return Results.BadRequest(error);
            if (!int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Results.Forbid();

            var item = await db.EmailTemplates.SingleOrDefaultAsync(x => x.TemplateType == type, ct) ?? new EmailTemplate { TemplateType = type };
            if (item.Id == 0) db.EmailTemplates.Add(item);
            Apply(item, request); item.UpdatedAtUtc = DateTime.UtcNow; item.UpdatedByUserId = userId;
            await db.SaveChangesAsync(ct);
            await audit.WriteAsync("EMAIL_TEMPLATE_UPDATED", "EmailTemplate", "success", userId, item.Id.ToString(), metadata: new { TemplateType = type });
            return Results.Ok(ToAdminDto(ToDto(item), definition));
        }).RequireAuthorization("AdminOnly");

        app.MapPost("/api/v1/admin/email/templates/{type}/reset", async (string type, HttpContext context, AppDbContext db, AuditService audit, CancellationToken ct) =>
        {
            try { _ = EmailTemplateService.GetDefinition(type); }
            catch (InvalidOperationException) { return Results.NotFound(); }
            var item = await db.EmailTemplates.SingleOrDefaultAsync(x => x.TemplateType == type, ct);
            if (item is not null) { db.EmailTemplates.Remove(item); await db.SaveChangesAsync(ct); }
            var userId = int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : (int?)null;
            await audit.WriteAsync("EMAIL_TEMPLATE_RESET", "EmailTemplate", "success", userId, metadata: new { TemplateType = type });
            return Results.NoContent();
        }).RequireAuthorization("AdminOnly");

        app.MapPost("/api/v1/admin/email/templates/{type}/preview", async (string type, EmailTemplateService templates, CancellationToken ct) =>
        {
            try { var rendered = await templates.RenderAsync(type, EmailTemplateService.SampleContext(type), ct); return Results.Ok(new { rendered.Subject, rendered.Html, rendered.PlainText }); }
            catch (InvalidOperationException) { return Results.NotFound(); }
        }).RequireAuthorization("AdminOnly");

        app.MapPost("/api/v1/admin/email/templates/{type}/test-send", async (string type, string email, HttpContext context, EmailTemplateService templates, EmailOutboxService outbox, AuditService audit, CancellationToken ct) =>
        {
            if (!System.Net.Mail.MailAddress.TryCreate(email, out _)) return Results.BadRequest("Ungültige Testadresse oder Vorlage.");
            try
            {
                var rendered = await templates.RenderAsync(type, EmailTemplateService.SampleContext(type), ct);
                var delivery = await outbox.EnqueueAsync($"Test:{type}", email, null, rendered.Subject, rendered.Html, ct: ct);
                var userId = int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : (int?)null;
                await audit.WriteAsync("EMAIL_TEMPLATE_TEST_SENT", "EmailTemplate", "success", userId, delivery.Id.ToString(), metadata: new { TemplateType = type, TestDeliveryId = delivery.Id });
                return Results.Ok(new { delivery.Id });
            }
            catch (InvalidOperationException) { return Results.NotFound(); }
        }).RequireAuthorization("AdminOnly");

        return app;
    }

    private static bool Valid(EmailTemplateDto item, EmailTemplateDefinition definition, out string error)
    {
        error = string.Empty;
        if (new[] { item.Subject, item.Heading, item.Intro, item.Body, item.Signature, item.Footer }.Any(string.IsNullOrWhiteSpace)) { error = "Pflichtfelder dürfen nicht leer sein."; return false; }
        var placeholders = Regex.Matches(string.Join(" ", item.Subject, item.Heading, item.Intro, item.Body, item.Closing, item.Signature, item.Footer), @"\{\{\s*([^} ]+)\s*\}\}").Select(match => match.Groups[1].Value).ToHashSet();
        if (placeholders.Any(name => !definition.AllowedPlaceholders.Contains(name))) { error = "Unbekannter Platzhalter."; return false; }
        if (definition.RequiredPlaceholders.Any(name => !placeholders.Contains(name))) { error = $"Erforderlicher Platzhalter fehlt: {string.Join(", ", definition.RequiredPlaceholders.Where(name => !placeholders.Contains(name)).Select(name => $"{{{{{name}}}}}"))}."; return false; }
        return true;
    }

    private static void Apply(EmailTemplate target, EmailTemplateDto source) { target.Subject = source.Subject.Trim(); target.Heading = source.Heading.Trim(); target.Intro = source.Intro.Trim(); target.Body = source.Body.Trim(); target.Closing = source.Closing.Trim(); target.Signature = source.Signature.Trim(); target.Footer = source.Footer.Trim(); }
    private static EmailTemplateDto ToDto(EmailTemplate item) => new(item.Id, item.TemplateType, item.Subject, item.Heading, item.Intro, item.Body, item.Closing, item.Signature, item.Footer, item.UpdatedAtUtc);
    private static EmailTemplateAdminDto ToAdminDto(EmailTemplateDto item, EmailTemplateDefinition definition) => new(item.Id, item.TemplateType, definition.DisplayName, definition.Description, definition.AllowedPlaceholders, definition.RequiredPlaceholders, item.Subject, item.Heading, item.Intro, item.Body, item.Closing, item.Signature, item.Footer, item.UpdatedAtUtc);
}

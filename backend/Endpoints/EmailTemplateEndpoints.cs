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
    private static readonly Dictionary<string, string[]> Allowed = new()
    {
        ["TripDriverAssigned"] = ["DriverName", "RideDate", "RideTime", "Destination", "InitiativeName"],
        ["TripSelfRegistered"] = ["DriverName", "RideDate", "RideTime", "Destination", "InitiativeName"],
        ["UserCreated"] = ["UserName", "ResetLink"]
    };
    public static IEndpointRouteBuilder MapEmailTemplateEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/admin/email/templates", async (AppDbContext db, CancellationToken ct) => Results.Ok(EmailTemplateService.Types.Select(type => db.EmailTemplates.AsNoTracking().Where(x => x.TemplateType == type).Select(x => ToDto(x)).FirstOrDefault() ?? EmailTemplateService.Default(type)).ToList())).RequireAuthorization("AdminOnly");
        app.MapPut("/api/v1/admin/email/templates/{type}", async (string type, EmailTemplateDto request, HttpContext context, AppDbContext db, AuditService audit, CancellationToken ct) =>
        {
            if (!Allowed.TryGetValue(type, out var allowed)) return Results.BadRequest("Unbekannter Template-Typ.");
            if (!Valid(request, allowed, out var error)) return Results.BadRequest(error);
            if (!int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Results.Forbid();
            var item = await db.EmailTemplates.SingleOrDefaultAsync(x => x.TemplateType == type, ct) ?? new EmailTemplate { TemplateType = type };
            if (item.Id == 0) db.EmailTemplates.Add(item);
            Apply(item, request); item.UpdatedAtUtc = DateTime.UtcNow; item.UpdatedByUserId = userId; await db.SaveChangesAsync(ct);
            await audit.WriteAsync("EMAIL_TEMPLATE_UPDATED", "EmailTemplate", "success", userId, item.Id.ToString(), metadata: new { TemplateType = type }); return Results.Ok(ToDto(item));
        }).RequireAuthorization("AdminOnly");
        app.MapPost("/api/v1/admin/email/templates/{type}/reset", async (string type,HttpContext context,AppDbContext db,AuditService audit,CancellationToken ct)=>{var item=await db.EmailTemplates.SingleOrDefaultAsync(x=>x.TemplateType==type,ct);if(item is not null){db.EmailTemplates.Remove(item);await db.SaveChangesAsync(ct);}var userId=int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier),out var id)?id:(int?)null;await audit.WriteAsync("EMAIL_TEMPLATE_RESET","EmailTemplate","success",userId,metadata:new{TemplateType=type});return Results.NoContent();}).RequireAuthorization("AdminOnly");
        app.MapPost("/api/v1/admin/email/templates/{type}/preview", async (string type,EmailTemplateService templates,CancellationToken ct)=>{if(!Allowed.ContainsKey(type))return Results.NotFound();var rendered=await templates.RenderAsync(type,Sample(type),ct);return Results.Ok(new{rendered.Subject,rendered.Html,rendered.PlainText});}).RequireAuthorization("AdminOnly");
        app.MapPost("/api/v1/admin/email/templates/{type}/test-send", async (string type,string email,HttpContext context,EmailTemplateService templates,EmailOutboxService outbox,AuditService audit,CancellationToken ct)=>{if(!Allowed.ContainsKey(type)||!System.Net.Mail.MailAddress.TryCreate(email,out _))return Results.BadRequest("Ungültige Testadresse oder Vorlage.");var rendered=await templates.RenderAsync(type,Sample(type),ct);var delivery=await outbox.EnqueueAsync($"Test:{type}",email,null,rendered.Subject,rendered.Html,ct:ct);var userId=int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier),out var id)?id:(int?)null;await audit.WriteAsync("EMAIL_TEMPLATE_TEST_SENT","EmailTemplate","success",userId,delivery.Id.ToString(),metadata:new{TemplateType=type,TestDeliveryId=delivery.Id});return Results.Ok(new{delivery.Id});}).RequireAuthorization("AdminOnly"); return app;
    }
    private static bool Valid(EmailTemplateDto item, string[] allowed, out string error) { error = ""; if (new[] { item.Subject, item.Heading, item.Intro, item.Body, item.Signature, item.Footer }.Any(string.IsNullOrWhiteSpace)) { error = "Pflichtfelder dürfen nicht leer sein."; return false; } var names = Regex.Matches(string.Join(" ", item.Subject,item.Heading,item.Intro,item.Body,item.Closing,item.Signature,item.Footer), @"\{\{\s*([^} ]+)\s*\}\}").Select(x => x.Groups[1].Value); if (names.Any(x => !allowed.Contains(x))) { error = "Unbekannter Platzhalter."; return false; } return true; }
    private static void Apply(EmailTemplate x, EmailTemplateDto d) { x.Subject=d.Subject.Trim();x.Heading=d.Heading.Trim();x.Intro=d.Intro.Trim();x.Body=d.Body.Trim();x.Closing=d.Closing.Trim();x.Signature=d.Signature.Trim();x.Footer=d.Footer.Trim(); }
    private static EmailTemplateDto ToDto(EmailTemplate x) => new(x.Id,x.TemplateType,x.Subject,x.Heading,x.Intro,x.Body,x.Closing,x.Signature,x.Footer,x.UpdatedAtUtc);
    private static object Sample(string type)=>type=="UserCreated"?new InvitationTemplateContext("Max Mustermann","https://example.invalid/reset"):type=="TripDriverAssigned"?new DriverAssignmentTemplateContext("Max Mustermann","17.07.2026","13:30","Musterstadt","Bürgerbus Musterstadt"):new SelfRegistrationTemplateContext("Max Mustermann","17.07.2026","13:30","Musterstadt","Bürgerbus Musterstadt");
}

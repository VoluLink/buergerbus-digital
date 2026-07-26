using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Services;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BuergerbusAPI.Endpoints;

public static class AdminNotificationEndpoints
{
    public static IEndpointRouteBuilder MapAdminNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/admin/notifications", async (AppDbContext db, CancellationToken ct) =>
        {
            var items = await db.AdminNotifications.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc)
                .Select(x => new AdminNotificationDto(x.Id, x.Title, x.Message, x.Audience, x.InitiativeId, null, x.Priority, x.ValidFromUtc, x.ValidUntilUtc, x.IsActive, x.CreatedAtUtc, x.UpdatedAtUtc)).ToListAsync(ct);
            return Results.Ok(items);
        }).RequireAuthorization("AdminOnly");
        app.MapGet("/api/v1/admin/notifications/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            var x = await db.AdminNotifications.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
            return x is null ? Results.NotFound() : Results.Ok(ToDto(x));
        }).RequireAuthorization("AdminOnly");
        app.MapPost("/api/v1/admin/notifications", async (AdminNotificationRequestDto request, HttpContext ctx, AppDbContext db, AuditService audit, CancellationToken ct) =>
        {
            if (!TryValidate(request, out var error)) return Results.BadRequest(error);
            if (!int.TryParse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Results.Forbid();
            if (request.InitiativeId.HasValue && !await db.Initiativen.AnyAsync(x => x.Id == request.InitiativeId, ct)) return Results.BadRequest("Die Initiative existiert nicht.");
            var item = new AdminNotification { Id = Guid.NewGuid(), Title = request.Title!.Trim(), Message = request.Message!.Trim(), Audience = request.Audience, InitiativeId = request.InitiativeId, Priority = request.Priority, ValidFromUtc = request.ValidFromUtc, ValidUntilUtc = request.ValidUntilUtc, IsActive = request.IsActive, CreatedByUserId = userId, CreatedAtUtc = DateTime.UtcNow };
            db.AdminNotifications.Add(item); await db.SaveChangesAsync(ct); await audit.WriteAsync("AdminNotificationCreated", "AdminNotification", "success", userId, item.Id.ToString(), item.InitiativeId, new { item.Audience, item.Priority, item.IsActive }); return Results.Created($"/api/v1/admin/notifications/{item.Id}", ToDto(item));
        }).RequireAuthorization("AdminOnly");
        app.MapPut("/api/v1/admin/notifications/{id:guid}", async (Guid id, AdminNotificationRequestDto request, HttpContext ctx, AppDbContext db, AuditService audit, CancellationToken ct) =>
        {
            if (!TryValidate(request, out var error)) return Results.BadRequest(error); var item = await db.AdminNotifications.FirstOrDefaultAsync(x => x.Id == id, ct); if (item is null) return Results.NotFound(); if (!int.TryParse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Results.Forbid(); if (request.InitiativeId.HasValue && !await db.Initiativen.AnyAsync(x => x.Id == request.InitiativeId, ct)) return Results.BadRequest("Die Initiative existiert nicht.");
            item.Title=request.Title!.Trim(); item.Message=request.Message!.Trim(); item.Audience=request.Audience; item.InitiativeId=request.InitiativeId; item.Priority=request.Priority; item.ValidFromUtc=request.ValidFromUtc; item.ValidUntilUtc=request.ValidUntilUtc; item.IsActive=request.IsActive; item.UpdatedAtUtc=DateTime.UtcNow; item.UpdatedByUserId=userId; await db.SaveChangesAsync(ct); await audit.WriteAsync("AdminNotificationUpdated","AdminNotification","success",userId,item.Id.ToString(),item.InitiativeId,new { item.Audience,item.Priority,item.IsActive }); return Results.Ok(ToDto(item));
        }).RequireAuthorization("AdminOnly");
        app.MapMethods("/api/v1/admin/notifications/{id:guid}/{state}", new[] { "PATCH" }, async (Guid id, string state, HttpContext ctx, AppDbContext db, AuditService audit, CancellationToken ct) =>
        {
            if (state is not ("activate" or "deactivate")) return Results.NotFound(); var item=await db.AdminNotifications.FirstOrDefaultAsync(x=>x.Id==id,ct); if(item is null)return Results.NotFound(); if(!int.TryParse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier),out var userId))return Results.Forbid(); item.IsActive=state=="activate";item.UpdatedAtUtc=DateTime.UtcNow;item.UpdatedByUserId=userId;await db.SaveChangesAsync(ct);await audit.WriteAsync(item.IsActive?"AdminNotificationActivated":"AdminNotificationDeactivated","AdminNotification","success",userId,item.Id.ToString(),item.InitiativeId,new { item.IsActive });return Results.Ok(ToDto(item));
        }).RequireAuthorization("AdminOnly");
        app.MapPost("/api/v1/admin/broadcast-emails", async (
            SendBroadcastNotificationRequest request,
            HttpContext httpContext,
            INotificationService notificationService,
            AuditService audit) =>
        {
            var subject = request.Subject?.Trim();
            var message = request.Message?.Trim();
            var type = request.Type?.Trim();

            if (string.IsNullOrWhiteSpace(subject))
            {
                return Results.BadRequest("Betreff ist erforderlich.");
            }

            if (string.IsNullOrWhiteSpace(message))
            {
                return Results.BadRequest("Nachricht ist erforderlich.");
            }

            if (string.IsNullOrWhiteSpace(type))
            {
                return Results.BadRequest("Typ ist erforderlich.");
            }

            var currentUserId = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(currentUserId))
            {
                return Results.Forbid();
            }

            try
            {
                var result = await notificationService.SendBroadcastAsync(
                    request with
                    {
                        Subject = subject,
                        Message = message,
                        Type = type,
                    },
                    currentUserId);

                await audit.WriteAsync(
                    result.Status == "Sent" ? "BroadcastEmailSent" : "BroadcastEmailPartiallyFailed",
                    "EmailDelivery",
                    result.Status == "Sent" ? "success" : "partial_failure",
                    int.Parse(currentUserId), result.NotificationId.ToString(), null,
                    new { Type = type, RecipientCount = result.SentCount + result.FailedCount, result.SentCount, result.FailedCount, result.Status });

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                await audit.WriteAsync("BroadcastEmailFailed", "EmailDelivery", "failure", int.TryParse(currentUserId, out var userId) ? userId : null, metadata: new { Type = type });
                return Results.BadRequest(ex.Message);
            }
        })
        .RequireAuthorization("AdminOnly");

        app.MapGet("/api/v1/admin/email/dashboard", async (AppDbContext db, SystemSettingsService settings, CancellationToken ct) =>
        {
            var today = DateTime.UtcNow.Date;
            var active = await settings.GetAsync(ct);
            return Results.Ok(new EmailDashboardDto(
                await db.EmailOutbox.CountAsync(x => x.Status == "Pending", ct),
                await db.EmailOutbox.CountAsync(x => x.Status == "Processing", ct),
                await db.EmailOutbox.CountAsync(x => x.Status == "Sent" && x.SentAtUtc >= today, ct),
                await db.EmailOutbox.CountAsync(x => x.Status == "Failed", ct),
                (active.EnableDriverAssignmentEmails ? 1 : 0) + (active.EnableSelfRegistrationEmails ? 1 : 0)));
        }).RequireAuthorization("AdminOnly");

        app.MapGet("/api/v1/admin/email/outbox", async (int? page, int? pageSize, string? status, string? type, DateTime? fromUtc, DateTime? toUtc, AppDbContext db, CancellationToken ct) =>
        {
            var currentPage = Math.Max(1, page ?? 1); var size = pageSize is 50 or 100 ? pageSize.Value : 25;
            var query = db.EmailOutbox.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
            if (!string.IsNullOrWhiteSpace(type)) query = query.Where(x => x.EmailType == type);
            if (fromUtc.HasValue) query = query.Where(x => x.CreatedAtUtc >= fromUtc.Value);
            if (toUtc.HasValue) query = query.Where(x => x.CreatedAtUtc <= toUtc.Value);
            var total = await query.CountAsync(ct);
            var items = await query.OrderByDescending(x => x.CreatedAtUtc).Skip((currentPage - 1) * size).Take(size).Select(x => new EmailOutboxItemDto(x.Id, x.EmailType, MaskEmail(x.Recipient), x.Subject, x.Status, x.Attempts, x.CreatedAtUtc, x.SentAtUtc, x.NextAttemptUtc, x.LastError)).ToListAsync(ct);
            return Results.Ok(new PagedEmailOutboxDto(items, currentPage, size, total));
        }).RequireAuthorization("AdminOnly");

        app.MapPost("/api/v1/admin/email/outbox/{id:guid}/retry", async (Guid id, HttpContext context, AppDbContext db, AuditService audit, CancellationToken ct) =>
        {
            var item = await db.EmailOutbox.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (item is null) return Results.NotFound();
            if (item.Status != "Failed") return Results.BadRequest("Nur fehlgeschlagene E-Mails können erneut versendet werden.");
            item.Status = "Pending"; item.Attempts = 0; item.NextAttemptUtc = DateTime.UtcNow; item.LastError = null; item.ProcessingStartedAtUtc = null;
            await db.SaveChangesAsync(ct);
            var userId = int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var parsed) ? parsed : (int?)null;
            await audit.WriteAsync("EMAIL_RETRY_MANUAL", "EmailOutbox", "success", userId, item.Id.ToString(), item.InitiativeId, new { item.EmailType });
            return Results.Ok();
        }).RequireAuthorization("AdminOnly");

        app.MapGet("/api/v1/admin/broadcast-emails", async (
            int? page, int? pageSize, string? status, string? type, DateTime? fromUtc, INotificationService notificationService) =>
        {
            var notifications = await notificationService.GetNotificationsAsync(page ?? 1, pageSize ?? 25, status, type, fromUtc);
            return Results.Ok(notifications);
        })
        .RequireAuthorization("AdminOnly");

        app.MapGet("/api/v1/admin/broadcast-emails/{id:guid}", async (
            Guid id,
            INotificationService notificationService) =>
        {
            try
            {
                var details = await notificationService.GetNotificationDetailsAsync(id);
                return Results.Ok(details);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(ex.Message);
            }
        })
        .RequireAuthorization("AdminOnly");

        app.MapPost("/api/v1/admin/cleanup/temporary-participants", async (
            ITemporaryParticipantCleanupService cleanupService,
            CancellationToken cancellationToken) =>
        {
            var count = await cleanupService.CleanupAsync(cancellationToken);

            return Results.Ok(new
            {
                anonymisiert = count
            });
        })
        .RequireAuthorization("AdminOnly");

        return app;
    }

    private static bool TryValidate(AdminNotificationRequestDto request, out string error)
    { error = string.Empty; if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Trim().Length > 150) { error = "Der Titel ist erforderlich und darf höchstens 150 Zeichen lang sein."; return false; } if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Trim().Length > 4000) { error = "Die Nachricht ist erforderlich und darf höchstens 4000 Zeichen lang sein."; return false; } if (request.ValidUntilUtc.HasValue && request.ValidUntilUtc <= request.ValidFromUtc) { error = "Das Gültigkeitsende muss nach dem Beginn liegen."; return false; } return true; }
    private static AdminNotificationDto ToDto(AdminNotification x) => new(x.Id,x.Title,x.Message,x.Audience,x.InitiativeId,null,x.Priority,x.ValidFromUtc,x.ValidUntilUtc,x.IsActive,x.CreatedAtUtc,x.UpdatedAtUtc);
    private static string MaskEmail(string email) { var at = email.IndexOf('@'); return at <= 1 ? "***" : $"{email[0]}***{email[at..]}"; }
}

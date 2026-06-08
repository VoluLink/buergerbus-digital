using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Services;

namespace BuergerbusAPI.Endpoints;

public static class AdminNotificationEndpoints
{
    public static IEndpointRouteBuilder MapAdminNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/admin/notifications/send", async (
            SendBroadcastNotificationRequest request,
            HttpContext httpContext,
            INotificationService notificationService) =>
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

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(ex.Message);
            }
        })
        .RequireAuthorization("AdminOnly");

        app.MapGet("/api/admin/notifications", async (
            INotificationService notificationService) =>
        {
            var notifications = await notificationService.GetNotificationsAsync();
            return Results.Ok(notifications);
        })
        .RequireAuthorization("AdminOnly");

        app.MapGet("/api/admin/notifications/{id:guid}", async (
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

        return app;
    }
}
using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using BuergerbusAPI.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
namespace BuergerbusAPI.Endpoints;
public static class NotificationEndpoints
{
 public static IEndpointRouteBuilder MapNotificationEndpoints(this IEndpointRouteBuilder app)
 {
  app.MapGet("/api/v1/app-settings", async (SystemSettingsService service, CancellationToken ct) =>
  {
   var settings = await service.GetAsync(ct);
   return Results.Ok(new { settings.DefaultRideDurationMinutes, settings.ShowDashboardNotifications });
  }).RequireAuthorization();
  app.MapGet("/api/v1/notifications/active", async (HttpContext context, AppDbContext db, CancellationToken ct) =>
  {
   if (!int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Results.Forbid();
   var user = await db.Benutzer.AsNoTracking().Include(x => x.BenutzerRollen).ThenInclude(x => x.Rolle).FirstOrDefaultAsync(x => x.Id == userId, ct);
   if (user is null) return Results.Forbid(); var audience = user.BenutzerRollen.Any(x => x.Rolle?.Rollenname == "Admin") ? AdminNotificationAudience.Admin : user.BenutzerRollen.Any(x => x.Rolle?.Rollenname == "Disponent") ? AdminNotificationAudience.Dispatcher : user.BenutzerRollen.Any(x => x.Rolle?.Rollenname == "Fahrer") ? AdminNotificationAudience.Driver : AdminNotificationAudience.Guest;
   var settings = await context.RequestServices.GetRequiredService<SystemSettingsService>().GetAsync(ct);
   if (!settings.ShowDashboardNotifications) return Results.Ok(Array.Empty<AdminNotificationDto>());
   var now = DateTime.UtcNow;
   var results = await db.AdminNotifications.AsNoTracking().Where(x => x.IsActive && x.ValidFromUtc <= now && (x.ValidUntilUtc == null || x.ValidUntilUtc > now) && (x.InitiativeId == null || x.InitiativeId == user.InitiativeId) && (x.Audience == AdminNotificationAudience.All || x.Audience == audience)).OrderByDescending(x => x.Priority).ThenByDescending(x => x.ValidFromUtc).Select(x => new AdminNotificationDto(x.Id,x.Title,x.Message,x.Audience,x.InitiativeId,null,x.Priority,x.ValidFromUtc,x.ValidUntilUtc,x.IsActive,x.CreatedAtUtc,x.UpdatedAtUtc)).ToListAsync(ct);
   return Results.Ok(results);
  }).RequireAuthorization(); return app;
 }
}

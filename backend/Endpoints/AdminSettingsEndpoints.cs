using BuergerbusAPI.DTOs;
using BuergerbusAPI.Services;
using System.Security.Claims;
namespace BuergerbusAPI.Endpoints;
public static class AdminSettingsEndpoints
{
 public static IEndpointRouteBuilder MapAdminSettingsEndpoints(this IEndpointRouteBuilder app)
 {
  app.MapGet("/api/v1/admin/settings", async (SystemSettingsService service, CancellationToken ct) => Results.Ok(SystemSettingsService.ToDto(await service.GetAsync(ct)))).RequireAuthorization("AdminOnly");
  app.MapPut("/api/v1/admin/settings", async (SystemSettingsDto request, HttpContext context, SystemSettingsService service, AuditService audit, CancellationToken ct) =>
  {
   if (!int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Results.Forbid();
   try { var settings = await service.UpdateAsync(request, userId, ct); await audit.WriteAsync("SystemSettingsUpdated", "SystemSettings", "success", userId, settings.Id.ToString(), metadata: new { fields = new[] { "TemporaryParticipantRetentionDays", "EnableDriverAssignmentEmails", "EnableSelfRegistrationEmails", "DefaultRideDurationMinutes", "ShowDashboardNotifications" } }); return Results.Ok(SystemSettingsService.ToDto(settings)); }
   catch (ArgumentOutOfRangeException) { return Results.BadRequest("Die Einstellungen sind ungültig."); }
  }).RequireAuthorization("AdminOnly");
  return app;
 }
}

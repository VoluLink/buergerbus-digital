using BuergerbusAPI.Data;
using BuergerbusAPI.Models;
using System.Text.Json;

namespace BuergerbusAPI.Services;

public sealed class AuditService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
{
    public async Task WriteAsync(string action, string entityType, string result, int? userId = null, string? entityId = null, int? initiativeId = null, object? metadata = null)
    {
        var context = httpContextAccessor.HttpContext;
        db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            InitiativeId = initiativeId,
            TimestampUtc = DateTime.UtcNow,
            Result = result,
            CorrelationId = context?.TraceIdentifier,
            MetadataJson = metadata is null ? null : JsonSerializer.Serialize(metadata)
        });
        await db.SaveChangesAsync();
    }
}

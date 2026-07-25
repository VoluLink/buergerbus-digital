using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace BuergerbusAPI.Endpoints;

public static class AdminAuditLogEndpoints
{
    public static IEndpointRouteBuilder MapAdminAuditLogEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/admin/audit-logs", async ([AsParameters] AuditLogQueryDto query, AppDbContext db, CancellationToken ct) =>
        {
            var page = Math.Max(1, query.Page); var pageSize = Math.Clamp(query.PageSize, 1, 100);
            var logs = db.AuditLogs.AsNoTracking();
            if (query.FromUtc.HasValue) logs = logs.Where(x => x.TimestampUtc >= query.FromUtc);
            if (query.ToUtc.HasValue) logs = logs.Where(x => x.TimestampUtc <= query.ToUtc);
            if (query.UserId.HasValue) logs = logs.Where(x => x.UserId == query.UserId);
            if (query.InitiativeId.HasValue) logs = logs.Where(x => x.InitiativeId == query.InitiativeId);
            if (!string.IsNullOrWhiteSpace(query.Action)) logs = logs.Where(x => x.Action == query.Action);
            if (!string.IsNullOrWhiteSpace(query.EntityType)) logs = logs.Where(x => x.EntityType == query.EntityType);
            if (!string.IsNullOrWhiteSpace(query.Result)) logs = logs.Where(x => x.Result == query.Result);
            if (!string.IsNullOrWhiteSpace(query.Search)) { var search = query.Search.Trim(); logs = logs.Where(x => x.Action.Contains(search) || x.EntityType.Contains(search) || (x.EntityId != null && x.EntityId.Contains(search))); }
            var total = await logs.CountAsync(ct);
            var items = await (from log in logs orderby log.TimestampUtc descending, log.Id descending
                join user in db.Benutzer.AsNoTracking() on log.UserId equals user.Id into users from user in users.DefaultIfEmpty()
                join initiative in db.Initiativen.AsNoTracking() on log.InitiativeId equals initiative.Id into initiatives from initiative in initiatives.DefaultIfEmpty()
                select new AuditLogListItemDto(log.Id, log.TimestampUtc, log.UserId, user == null ? null : user.Nutzername, log.Action, log.EntityType, log.EntityId, log.InitiativeId, initiative == null ? null : initiative.Name, log.Result, log.CorrelationId))
                .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
            return Results.Ok(new PagedAuditLogResultDto(items, page, pageSize, total));
        }).RequireAuthorization("AdminOnly");
        app.MapGet("/api/v1/admin/audit-logs/{id:long}", async (long id, AppDbContext db, CancellationToken ct) =>
        {
            var item = await db.AuditLogs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
            if (item is null) return Results.NotFound();
            var user = item.UserId is null ? null : await db.Benutzer.AsNoTracking().FirstOrDefaultAsync(x => x.Id == item.UserId, ct);
            var initiative = item.InitiativeId is null ? null : await db.Initiativen.AsNoTracking().FirstOrDefaultAsync(x => x.Id == item.InitiativeId, ct);
            return Results.Ok(new AuditLogDetailDto(item.Id,item.TimestampUtc,item.UserId,user?.Nutzername,item.Action,item.EntityType,item.EntityId,item.InitiativeId,initiative?.Name,item.Result,item.CorrelationId,SafeMetadata(item.MetadataJson)));
        }).RequireAuthorization("AdminOnly");
        return app;
    }
    private static IReadOnlyDictionary<string,string> SafeMetadata(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new Dictionary<string,string>();
        var blocked = new[] { "password", "token", "secret", "connection", "smtp", "cookie", "authorization" };
        try { using var doc = JsonDocument.Parse(json); return doc.RootElement.ValueKind != JsonValueKind.Object ? new Dictionary<string,string>() : doc.RootElement.EnumerateObject().Where(p => !blocked.Any(x => p.Name.Contains(x, StringComparison.OrdinalIgnoreCase))).ToDictionary(p => p.Name, p => SafeValue(p.Value)); }
        catch (JsonException) { return new Dictionary<string,string>(); }
    }
    private static string SafeValue(JsonElement value)
    {
        if (value.ValueKind is JsonValueKind.String or JsonValueKind.Number or JsonValueKind.True or JsonValueKind.False) return value.ToString();
        if (value.ValueKind == JsonValueKind.Array) return string.Join(", ", value.EnumerateArray().Where(item => item.ValueKind is JsonValueKind.String or JsonValueKind.Number or JsonValueKind.True or JsonValueKind.False).Select(item => item.ToString()));
        return "[ausgeblendet]";
    }
}

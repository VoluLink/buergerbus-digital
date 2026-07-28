namespace BuergerbusAPI.DTOs;
public sealed record AuditLogDetailDto(long Id, DateTime TimestampUtc, int? UserId, string? UserDisplayName, string Action, string EntityType, string? EntityId, int? InitiativeId, string? InitiativeName, string Result, string? CorrelationId, IReadOnlyDictionary<string, string> Metadata);

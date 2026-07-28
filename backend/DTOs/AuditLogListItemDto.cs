namespace BuergerbusAPI.DTOs;
public sealed record AuditLogListItemDto(long Id, DateTime TimestampUtc, int? UserId, string? UserDisplayName, string Action, string EntityType, string? EntityId, int? InitiativeId, string? InitiativeName, string Result, string? CorrelationId);

namespace BuergerbusAPI.Models;

/// <summary>Privacy-minimised, append-only audit event. Never store secrets or full contact data.</summary>
public class AuditLog
{
    public long Id { get; set; }
    public int? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public int? InitiativeId { get; set; }
    public DateTime TimestampUtc { get; set; }
    public string Result { get; set; } = string.Empty;
    public string? CorrelationId { get; set; }
    public string? MetadataJson { get; set; }
}

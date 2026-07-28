namespace BuergerbusAPI.Models;
public class RefreshSession
{
 public Guid Id { get; set; } public int UserId { get; set; } public string TokenHash { get; set; } = string.Empty;
 public DateTime CreatedAtUtc { get; set; } public DateTime ExpiresAtUtc { get; set; } public DateTime? LastUsedAtUtc { get; set; } public DateTime? RevokedAtUtc { get; set; } public Guid? ReplacedBySessionId { get; set; } public int AuthVersion { get; set; } public string? UserAgentHash { get; set; } public string? IpAddressHash { get; set; } public string? RevokedReason { get; set; }
 public Benutzer? Benutzer { get; set; }
}

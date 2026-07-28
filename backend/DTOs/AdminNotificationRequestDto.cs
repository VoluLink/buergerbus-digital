using BuergerbusAPI.Models;
namespace BuergerbusAPI.DTOs;
public sealed record AdminNotificationRequestDto(string? Title, string? Message, AdminNotificationAudience Audience, int? InitiativeId, AdminNotificationPriority Priority, DateTime ValidFromUtc, DateTime? ValidUntilUtc, bool IsActive);

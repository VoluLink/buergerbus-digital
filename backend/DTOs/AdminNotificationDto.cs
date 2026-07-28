using BuergerbusAPI.Models;
namespace BuergerbusAPI.DTOs;
public sealed record AdminNotificationDto(Guid Id, string Title, string Message, AdminNotificationAudience Audience, int? InitiativeId, string? InitiativeName, AdminNotificationPriority Priority, DateTime ValidFromUtc, DateTime? ValidUntilUtc, bool IsActive, DateTime CreatedAtUtc, DateTime? UpdatedAtUtc);

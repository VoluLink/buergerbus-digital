using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;

namespace BuergerbusAPI.Services;

public interface INotificationService
{
    Task<NotificationResultDto> SendBroadcastAsync(SendBroadcastNotificationRequest request, string createdByUserId);
    Task SendUserCreatedEmailAsync(Benutzer user, string inviteOrResetToken);
    Task<PagedNotificationResultDto> GetNotificationsAsync(int page, int pageSize, string? status, string? type, DateTime? fromUtc);
    Task<NotificationDetailsDto> GetNotificationDetailsAsync(Guid notificationId);
}

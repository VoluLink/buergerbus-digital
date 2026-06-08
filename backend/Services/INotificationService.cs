using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;

namespace BuergerbusAPI.Services;

public interface INotificationService
{
    Task<NotificationResultDto> SendBroadcastAsync(SendBroadcastNotificationRequest request, string createdByUserId);
    Task SendUserCreatedEmailAsync(Benutzer user, string inviteOrResetToken);
    Task<List<NotificationSummaryDto>> GetNotificationsAsync();
    Task<NotificationDetailsDto> GetNotificationDetailsAsync(Guid notificationId);
}
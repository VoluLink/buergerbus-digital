namespace BuergerbusAPI.DTOs;
public sealed record PagedNotificationResultDto(IReadOnlyList<NotificationSummaryDto> Items, int Page, int PageSize, int TotalCount);

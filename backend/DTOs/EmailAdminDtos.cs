namespace BuergerbusAPI.DTOs;
public sealed record EmailDashboardDto(int Pending, int Processing, int SentToday, int Failed, int ActiveAutomaticEmails);
public sealed record EmailOutboxItemDto(Guid Id, string EmailType, string Recipient, string Subject, string Status, int Attempts, DateTime CreatedAtUtc, DateTime? SentAtUtc, DateTime? NextAttemptUtc, string? LastError);
public sealed record PagedEmailOutboxDto(IReadOnlyList<EmailOutboxItemDto> Items, int Page, int PageSize, int TotalCount);

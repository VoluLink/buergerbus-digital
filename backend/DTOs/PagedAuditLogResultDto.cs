namespace BuergerbusAPI.DTOs;
public sealed record PagedAuditLogResultDto(IReadOnlyList<AuditLogListItemDto> Items, int Page, int PageSize, int TotalCount);

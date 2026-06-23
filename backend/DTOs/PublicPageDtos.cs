namespace BuergerbusAPI.DTOs;

public record PublicPageDto(string Slug, string Title, string Content);

public record AdminPageDto(
    Guid Id,
    string Slug,
    string Title,
    string Content,
    bool IsPublished,
    bool ShowInFooter,
    int? FooterSortOrder,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid? UpdatedByUserId
);

public record CreatePageRequest(
    string Slug,
    string Title,
    string Content,
    bool IsPublished,
    bool ShowInFooter,
    int? FooterSortOrder
);

public record UpdatePageRequest(
    string Slug,
    string Title,
    string Content,
    bool IsPublished,
    bool ShowInFooter,
    int? FooterSortOrder
);
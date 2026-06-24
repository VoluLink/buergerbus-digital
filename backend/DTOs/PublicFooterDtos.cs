using BuergerbusAPI.Models;

namespace BuergerbusAPI.DTOs;

public record PublicFooterLinkDto(
    string Label,
    string Url,
    bool IsExternal,
    bool OpenInNewTab,
    int SortOrder
);

public record PublicFooterResponse(List<PublicFooterLinkDto> Links);

public record AdminFooterLinkDto(
    Guid Id,
    string Label,
    FooterLinkType LinkType,
    Guid? SitePageId,
    string? SitePageSlug,
    string? ExternalUrl,
    int SortOrder,
    bool IsActive,
    bool OpenInNewTab,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid? UpdatedByUserId
);

public record CreateFooterLinkRequest(
    string Label,
    FooterLinkType LinkType,
    Guid? SitePageId,
    string? ExternalUrl,
    int SortOrder,
    bool IsActive,
    bool OpenInNewTab
);

public record UpdateFooterLinkRequest(
    string Label,
    FooterLinkType LinkType,
    Guid? SitePageId,
    string? ExternalUrl,
    int SortOrder,
    bool IsActive,
    bool OpenInNewTab
);
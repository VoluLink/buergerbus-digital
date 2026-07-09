using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BuergerbusAPI.Services;

public class FooterService
{
    private readonly AppDbContext db;

    public FooterService(AppDbContext db)
    {
        this.db = db;
    }

    public async Task<List<AdminFooterLinkDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var links = await db.FooterLinks
            .AsNoTracking()
            .Include(link => link.SitePage)
            .OrderBy(link => link.SortOrder)
            .ThenBy(link => link.Label)
            .ToListAsync(cancellationToken);

        return links.Select(ToAdminDto).ToList();
    }

    public async Task<AdminFooterLinkDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var link = await db.FooterLinks
            .AsNoTracking()
            .Include(item => item.SitePage)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        return link is null ? null : ToAdminDto(link);
    }

    public async Task<(bool Ok, string? Error, AdminFooterLinkDto? Link)> CreateAsync(CreateFooterLinkRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedLabel = request.Label.Trim();
        if (string.IsNullOrWhiteSpace(normalizedLabel))
        {
            return (false, "Label ist erforderlich.", null);
        }

        var (sitePage, externalUrl, error) = await ValidateTargetAsync(request.LinkType, request.SitePageId, request.ExternalUrl, cancellationToken);
        if (error is not null)
        {
            return (false, error, null);
        }

        var entity = new FooterLink
        {
            Id = Guid.NewGuid(),
            Label = normalizedLabel,
            LinkType = request.LinkType,
            SitePageId = sitePage?.Id,
            ExternalUrl = externalUrl,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive,
            OpenInNewTab = request.OpenInNewTab,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        db.FooterLinks.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        return (true, null, await GetByIdAsync(entity.Id, cancellationToken));
    }

    public async Task<(bool Ok, string? Error, AdminFooterLinkDto? Link)> UpdateAsync(Guid id, UpdateFooterLinkRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await db.FooterLinks.FirstOrDefaultAsync(link => link.Id == id, cancellationToken);
        if (entity is null)
        {
            return (false, "Footer-Link nicht gefunden.", null);
        }

        var normalizedLabel = request.Label.Trim();
        if (string.IsNullOrWhiteSpace(normalizedLabel))
        {
            return (false, "Label ist erforderlich.", null);
        }

        var (sitePage, externalUrl, error) = await ValidateTargetAsync(request.LinkType, request.SitePageId, request.ExternalUrl, cancellationToken);
        if (error is not null)
        {
            return (false, error, null);
        }

        entity.Label = normalizedLabel;
        entity.LinkType = request.LinkType;
        entity.SitePageId = sitePage?.Id;
        entity.ExternalUrl = externalUrl;
        entity.SortOrder = request.SortOrder;
        entity.IsActive = request.IsActive;
        entity.OpenInNewTab = request.OpenInNewTab;
        entity.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return (true, null, await GetByIdAsync(entity.Id, cancellationToken));
    }

    public async Task<(bool Ok, string? Error)> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.FooterLinks.FirstOrDefaultAsync(link => link.Id == id, cancellationToken);
        if (entity is null)
        {
            return (false, "Footer-Link nicht gefunden.");
        }

        db.FooterLinks.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);

        return (true, null);
    }

    public async Task<PublicFooterResponse> GetPublicFooterAsync(CancellationToken cancellationToken = default)
    {
        var explicitLinks = await db.FooterLinks
            .AsNoTracking()
            .Include(link => link.SitePage)
            .Where(link => link.IsActive)
            .OrderBy(link => link.SortOrder)
            .ThenBy(link => link.Label)
            .ToListAsync(cancellationToken);

        var pageLinks = await db.SitePages
            .AsNoTracking()
            .Where(page => page.IsPublished && page.ShowInFooter)
            .OrderBy(page => page.FooterSortOrder ?? int.MaxValue)
            .ThenBy(page => page.Title)
            .ToListAsync(cancellationToken);

        var explicitPageIds = explicitLinks
            .Where(link => link.SitePageId.HasValue)
            .Select(link => link.SitePageId!.Value)
            .ToHashSet();

        var links = explicitLinks.Select(ToPublicDto).ToList();

        links.AddRange(pageLinks
            .Where(page => !explicitPageIds.Contains(page.Id))
            .Select(page => new PublicFooterLinkDto(
                page.Title,
                $"/pages/{page.Slug}",
                false,
                false,
                page.FooterSortOrder ?? int.MaxValue)));

        return new PublicFooterResponse(
            links
                .OrderBy(link => link.SortOrder)
                .ThenBy(link => link.Label)
                .ToList());
    }

    private async Task<(SitePage? SitePage, string? ExternalUrl, string? Error)> ValidateTargetAsync(
        FooterLinkType linkType,
        Guid? sitePageId,
        string? externalUrl,
        CancellationToken cancellationToken)
    {
        if (linkType == FooterLinkType.InternalPage)
        {
            if (!sitePageId.HasValue)
            {
                return (null, null, "Interne Footer-Links benötigen eine Seite.");
            }

            var sitePage = await db.SitePages.FirstOrDefaultAsync(page => page.Id == sitePageId, cancellationToken);
            if (sitePage is null)
            {
                return (null, null, "Ausgewählte Seite wurde nicht gefunden.");
            }

            if (!sitePage.IsPublished)
            {
                return (null, null, "Interne Footer-Links müssen auf veröffentlichte Seiten zeigen.");
            }

            return (sitePage, null, null);
        }

        if (linkType == FooterLinkType.ExternalUrl)
        {
            var normalizedUrl = externalUrl?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedUrl))
            {
                return (null, null, "Externe URL ist erforderlich.");
            }

            if (normalizedUrl.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase)
                || normalizedUrl.StartsWith("data:", StringComparison.OrdinalIgnoreCase)
                || !normalizedUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
                || !Uri.TryCreate(normalizedUrl, UriKind.Absolute, out var uri)
                || !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            {
                return (null, null, "Externe URLs müssen mit https:// beginnen.");
            }

            return (null, normalizedUrl, null);
        }

        return (null, null, "Unbekannter Link-Typ.");
    }

    private static PublicFooterLinkDto ToPublicDto(FooterLink link)
    {
        var url = link.LinkType == FooterLinkType.InternalPage
            ? $"/pages/{link.SitePage?.Slug ?? string.Empty}"
            : link.ExternalUrl ?? string.Empty;

        return new PublicFooterLinkDto(
            link.Label,
            url,
            link.LinkType == FooterLinkType.ExternalUrl,
            link.OpenInNewTab,
            link.SortOrder);
    }

    private static AdminFooterLinkDto ToAdminDto(FooterLink link)
    {
        return new AdminFooterLinkDto(
            link.Id,
            link.Label,
            link.LinkType,
            link.SitePageId,
            link.SitePage?.Slug,
            link.ExternalUrl,
            link.SortOrder,
            link.IsActive,
            link.OpenInNewTab,
            link.CreatedAt,
            link.UpdatedAt,
            link.UpdatedByUserId);
    }
}
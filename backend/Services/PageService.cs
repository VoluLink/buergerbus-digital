using System.Text.RegularExpressions;
using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BuergerbusAPI.Services;

public class PageService
{
    private static readonly Regex SlugRegex = new("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);
    private static readonly HashSet<string> ReservedSlugs = new(StringComparer.OrdinalIgnoreCase)
    {
        "admin",
        "api",
        "auth",
        "dashboard",
        "fahrten",
        "fahrer",
        "fahrgast",
        "fahrgastinfos",
        "fahrzeuginfos",
        "forgot-password",
        "initiativen",
        "login",
        "pages",
        "passwort-vergessen",
        "profil",
        "reset-password",
        "rollenverteilung",
        "users"
    };

    private readonly AppDbContext db;

    public PageService(AppDbContext db)
    {
        this.db = db;
    }

    public async Task<List<AdminPageDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var pages = await db.SitePages
            .AsNoTracking()
            .OrderBy(page => page.Title)
            .ToListAsync(cancellationToken);

        return pages.Select(ToAdminDto).ToList();
    }

    public async Task<AdminPageDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var page = await db.SitePages
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        return page is null ? null : ToAdminDto(page);
    }

    public async Task<PublicPageDto?> GetPublishedBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var normalizedSlug = NormalizeSlug(slug);
        if (normalizedSlug is null)
        {
            return null;
        }

        var page = await db.SitePages
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Slug == normalizedSlug && item.IsPublished, cancellationToken);

        return page is null ? null : new PublicPageDto(page.Slug, page.Title, page.Content);
    }

    public async Task<(bool Ok, string? Error, AdminPageDto? Page)> CreateAsync(CreatePageRequest request, CancellationToken cancellationToken = default)
    {
        var validationError = await ValidateAsync(request.Slug, request.Title, request.Content, null, cancellationToken);
        if (validationError is not null)
        {
            return (false, validationError, null);
        }

        var entity = new SitePage
        {
            Id = Guid.NewGuid(),
            Slug = NormalizeSlug(request.Slug)!,
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            IsPublished = request.IsPublished,
            ShowInFooter = request.ShowInFooter,
            FooterSortOrder = request.FooterSortOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        db.SitePages.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        return (true, null, ToAdminDto(entity));
    }

    public async Task<(bool Ok, string? Error, AdminPageDto? Page)> UpdateAsync(Guid id, UpdatePageRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await db.SitePages.FirstOrDefaultAsync(page => page.Id == id, cancellationToken);
        if (entity is null)
        {
            return (false, "Seite nicht gefunden.", null);
        }

        var validationError = await ValidateAsync(request.Slug, request.Title, request.Content, id, cancellationToken);
        if (validationError is not null)
        {
            return (false, validationError, null);
        }

        entity.Slug = NormalizeSlug(request.Slug)!;
        entity.Title = request.Title.Trim();
        entity.Content = request.Content.Trim();
        entity.IsPublished = request.IsPublished;
        entity.ShowInFooter = request.ShowInFooter;
        entity.FooterSortOrder = request.FooterSortOrder;
        entity.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return (true, null, ToAdminDto(entity));
    }

    public async Task<(bool Ok, string? Error)> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.SitePages.FirstOrDefaultAsync(page => page.Id == id, cancellationToken);
        if (entity is null)
        {
            return (false, "Seite nicht gefunden.");
        }

        var hasFooterLinks = await db.FooterLinks.AnyAsync(link => link.SitePageId == id, cancellationToken);
        if (hasFooterLinks)
        {
            return (false, "Seite wird noch von einem Footer-Link verwendet.");
        }

        db.SitePages.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);

        return (true, null);
    }

    public async Task<List<PublicFooterLinkDto>> GetPublicPageLinksAsync(CancellationToken cancellationToken = default)
    {
        var pages = await db.SitePages
            .AsNoTracking()
            .Where(page => page.IsPublished && page.ShowInFooter)
            .OrderBy(page => page.FooterSortOrder ?? int.MaxValue)
            .ThenBy(page => page.Title)
            .ToListAsync(cancellationToken);

        return pages
            .Select(page => new PublicFooterLinkDto(
                page.Title,
                $"/pages/{page.Slug}",
                false,
                false,
                page.FooterSortOrder ?? int.MaxValue))
            .ToList();
    }

    private async Task<string?> ValidateAsync(string slug, string title, string content, Guid? currentId, CancellationToken cancellationToken)
    {
        var normalizedSlug = NormalizeSlug(slug);
        if (normalizedSlug is null)
        {
            return "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.";
        }

        if (ReservedSlugs.Contains(normalizedSlug))
        {
            return "Slug ist für Systemrouten reserviert.";
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            return "Titel ist erforderlich.";
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            return "Inhalt ist erforderlich.";
        }

        var exists = await db.SitePages.AnyAsync(page => page.Slug == normalizedSlug && page.Id != currentId, cancellationToken);
        if (exists)
        {
            return "Slug existiert bereits.";
        }

        return null;
    }

    private static string? NormalizeSlug(string slug)
    {
        var normalized = slug.Trim().ToLowerInvariant();
        return SlugRegex.IsMatch(normalized) ? normalized : null;
    }

    private static AdminPageDto ToAdminDto(SitePage page)
    {
        return new AdminPageDto(
            page.Id,
            page.Slug,
            page.Title,
            page.Content,
            page.IsPublished,
            page.ShowInFooter,
            page.FooterSortOrder,
            page.CreatedAt,
            page.UpdatedAt,
            page.UpdatedByUserId);
    }
}
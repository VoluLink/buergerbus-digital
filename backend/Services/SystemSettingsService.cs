using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace BuergerbusAPI.Services;

public sealed class SystemSettingsService(AppDbContext db, IMemoryCache cache)
{
    private const string CacheKey = "system-settings";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public async Task<SystemSettings> GetAsync(CancellationToken cancellationToken = default) =>
        Normalize(await cache.GetOrCreateAsync(CacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            return await db.SystemSettings.AsNoTracking().SingleOrDefaultAsync(cancellationToken)
                ?? new SystemSettings { UpdatedAtUtc = DateTime.UtcNow };
        }) ?? new SystemSettings { UpdatedAtUtc = DateTime.UtcNow });

    public async Task<SystemSettings> UpdateAsync(SystemSettingsDto request, int userId, CancellationToken cancellationToken)
    {
        if (request.TemporaryParticipantRetentionDays is < 1 or > 365 || request.DefaultRideDurationMinutes is < 15 or > 1440 || request.MaxEmailAttempts is < 1 or > 5 || request.EmailHistoryRetentionDays is < 1 or > 3650 || request.MaxEmailsPerMinute is < 1 or > 500)
            throw new ArgumentOutOfRangeException(nameof(request), "Die Einstellungen liegen außerhalb der erlaubten Grenzen.");
        var settings = await db.SystemSettings.SingleOrDefaultAsync(cancellationToken);
        if (settings is null) { settings = new SystemSettings(); db.SystemSettings.Add(settings); }
        settings.TemporaryParticipantRetentionDays = request.TemporaryParticipantRetentionDays;
        settings.EnableDriverAssignmentEmails = request.EnableDriverAssignmentEmails;
        settings.EnableSelfRegistrationEmails = request.EnableSelfRegistrationEmails;
        settings.DefaultRideDurationMinutes = request.DefaultRideDurationMinutes;
        settings.ShowDashboardNotifications = request.ShowDashboardNotifications;
        settings.MaxEmailAttempts = request.MaxEmailAttempts;
        settings.EmailHistoryRetentionDays = request.EmailHistoryRetentionDays;
        settings.MaxEmailsPerMinute = request.MaxEmailsPerMinute;
        settings.EnableEmailHistoryCleanup = request.EnableEmailHistoryCleanup;
        settings.UpdatedAtUtc = DateTime.UtcNow;
        settings.UpdatedByUserId = userId;
        await db.SaveChangesAsync(cancellationToken);
        cache.Remove(CacheKey);
        return settings;
    }

    public static SystemSettingsDto ToDto(SystemSettings item)
    {
        var normalized = Normalize(item);
        return new(normalized.TemporaryParticipantRetentionDays, normalized.EnableDriverAssignmentEmails, normalized.EnableSelfRegistrationEmails, normalized.DefaultRideDurationMinutes, normalized.ShowDashboardNotifications, normalized.MaxEmailAttempts, normalized.EmailHistoryRetentionDays, normalized.MaxEmailsPerMinute, normalized.EnableEmailHistoryCleanup, normalized.UpdatedAtUtc);
    }

    private static SystemSettings Normalize(SystemSettings settings)
    {
        // Existing rows predate the Outbox columns. Their SQL migration defaults are 0/false;
        // use the same safe values as a newly created SystemSettings instance.
        var legacyOutboxDefaults = settings.MaxEmailAttempts < 1 && settings.EmailHistoryRetentionDays < 1 && settings.MaxEmailsPerMinute < 1;
        if (settings.MaxEmailAttempts < 1) settings.MaxEmailAttempts = 5;
        if (settings.EmailHistoryRetentionDays < 1) settings.EmailHistoryRetentionDays = 180;
        if (settings.MaxEmailsPerMinute < 1) settings.MaxEmailsPerMinute = 100;
        if (legacyOutboxDefaults) settings.EnableEmailHistoryCleanup = true;
        return settings;
    }
}

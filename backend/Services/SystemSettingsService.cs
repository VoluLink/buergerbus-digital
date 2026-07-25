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
        await cache.GetOrCreateAsync(CacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            return await db.SystemSettings.AsNoTracking().SingleOrDefaultAsync(cancellationToken)
                ?? new SystemSettings { UpdatedAtUtc = DateTime.UtcNow };
        }) ?? new SystemSettings { UpdatedAtUtc = DateTime.UtcNow };

    public async Task<SystemSettings> UpdateAsync(SystemSettingsDto request, int userId, CancellationToken cancellationToken)
    {
        if (request.TemporaryParticipantRetentionDays is < 1 or > 365 || request.DefaultRideDurationMinutes is < 15 or > 1440)
            throw new ArgumentOutOfRangeException(nameof(request), "Die Einstellungen liegen außerhalb der erlaubten Grenzen.");
        var settings = await db.SystemSettings.SingleOrDefaultAsync(cancellationToken);
        if (settings is null) { settings = new SystemSettings(); db.SystemSettings.Add(settings); }
        settings.TemporaryParticipantRetentionDays = request.TemporaryParticipantRetentionDays;
        settings.EnableDriverAssignmentEmails = request.EnableDriverAssignmentEmails;
        settings.EnableSelfRegistrationEmails = request.EnableSelfRegistrationEmails;
        settings.DefaultRideDurationMinutes = request.DefaultRideDurationMinutes;
        settings.ShowDashboardNotifications = request.ShowDashboardNotifications;
        settings.UpdatedAtUtc = DateTime.UtcNow;
        settings.UpdatedByUserId = userId;
        await db.SaveChangesAsync(cancellationToken);
        cache.Remove(CacheKey);
        return settings;
    }

    public static SystemSettingsDto ToDto(SystemSettings item) => new(item.TemporaryParticipantRetentionDays, item.EnableDriverAssignmentEmails, item.EnableSelfRegistrationEmails, item.DefaultRideDurationMinutes, item.ShowDashboardNotifications, item.UpdatedAtUtc);
}

using BuergerbusAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace BuergerbusAPI.Services;

public class FahrgastCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public FahrgastCleanupService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken); // Intervall
            await DeactivateOldFahrgaeste();
        }
    }

    private async Task DeactivateOldFahrgaeste()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cutoff = DateTime.UtcNow.AddMinutes(-2); // TEST: später z.B. -60 Tage

        var oldFahrgaeste = await db.Fahrgaeste
            .Where(f => f.Aktiv && f.LetzteNutzung < cutoff)
            .ToListAsync();

        foreach (var fahrgast in oldFahrgaeste)
        {
            fahrgast.Aktiv = false;
        }

        if (oldFahrgaeste.Any())
        {
            await db.SaveChangesAsync();
        }
    }
}
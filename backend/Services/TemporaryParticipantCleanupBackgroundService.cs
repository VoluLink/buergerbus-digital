using Microsoft.Extensions.DependencyInjection;

namespace BuergerbusAPI.Services;

public class TemporaryParticipantCleanupBackgroundService : BackgroundService
{
    private static readonly TimeSpan Intervall = TimeSpan.FromDays(1);

    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<TemporaryParticipantCleanupBackgroundService> _logger;

    public TemporaryParticipantCleanupBackgroundService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<TemporaryParticipantCleanupBackgroundService> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TemporaryParticipantCleanupBackgroundService gestartet.");

        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Starte Cleanup temporärer Fahrtteilnehmer.");

            await RunCleanupAsync(stoppingToken);

            _logger.LogInformation("Cleanup temporärer Fahrtteilnehmer beendet.");

            try
            {
                await Task.Delay(Intervall, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
            }
        }
    }

    private async Task RunCleanupAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var cleanupService = scope.ServiceProvider.GetRequiredService<ITemporaryParticipantCleanupService>();

            await cleanupService.CleanupAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fehler beim Cleanup temporärer Fahrtteilnehmer.");
        }
    }
}
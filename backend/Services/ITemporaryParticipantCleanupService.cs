namespace BuergerbusAPI.Services;

public interface ITemporaryParticipantCleanupService
{
    Task<int> CleanupAsync(CancellationToken cancellationToken = default);
}
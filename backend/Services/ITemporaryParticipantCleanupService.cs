namespace BuergerbusAPI.Services;

public interface ITemporaryParticipantCleanupService
{
    Task<int> AnonymisiereTemporaereFahrtTeilnehmerAsync(CancellationToken cancellationToken = default);
}
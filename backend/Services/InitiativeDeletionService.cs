using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BuergerbusAPI.Services;

public class InitiativeDeletionService
{
    private const string DefaultInitiativeName = "Default";

    private readonly AppDbContext db;

    public InitiativeDeletionService(AppDbContext db)
    {
        this.db = db;
    }

    public async Task<InitiativeDeletePreviewDto?> GetDeletePreviewAsync(int id, CancellationToken cancellationToken = default)
    {
        var initiative = await db.Initiativen
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (initiative is null)
        {
            return null;
        }

        var isDefault = IsDefaultInitiative(initiative);

        var users = await db.Benutzer.AsNoTracking().CountAsync(item => item.InitiativeId == id, cancellationToken);
        var vehicles = await db.Fahrzeuge.AsNoTracking().CountAsync(item => item.InitiativeId == id, cancellationToken);
        var maintenanceRecords = await db.Wartungen.AsNoTracking().CountAsync(item => item.InitiativeId == id, cancellationToken);
        var damageReports = await db.Schaeden.AsNoTracking().CountAsync(item => item.InitiativeId == id, cancellationToken);
        var rides = await db.Fahrten.AsNoTracking().CountAsync(item => item.InitiativeId == id, cancellationToken);
        var passengers = await db.Fahrgaeste.AsNoTracking().CountAsync(item => item.InitiativeId == id, cancellationToken);
        var rideSegments = await db.Fahrten.AsNoTracking()
            .Where(item => item.InitiativeId == id)
            .SelectMany(item => item.Teilstrecken)
            .CountAsync(cancellationToken);
        var notifications = await db.Benachrichtigungen.AsNoTracking().CountAsync(item => item.InitiativeId == id, cancellationToken);
        var deletionDeadlines = await db.Loeschfristen.AsNoTracking().CountAsync(item => item.InitiativeId == id, cancellationToken);

        var driverVehicleAssignments = await db.FahrerFahrzeuge
            .AsNoTracking()
            .CountAsync(item => item.Fahrzeug.InitiativeId == id, cancellationToken);

        var affected = new InitiativeDeletePreviewAffectedDto(
            users,
            vehicles,
            maintenanceRecords,
            damageReports,
            rides,
            passengers,
            rideSegments,
            notifications,
            deletionDeadlines,
            driverVehicleAssignments
        );

        var reason = isDefault
            ? "Die Standard-Initiative kann nicht gelöscht werden."
            : null;

        return new InitiativeDeletePreviewDto(
            initiative.Id,
            initiative.Name,
            !isDefault,
            isDefault,
            reason,
            affected
        );
    }

    public async Task<(bool Ok, string? Error)> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var initiative = await db.Initiativen.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (initiative is null)
        {
            return (false, "Initiative wurde nicht gefunden.");
        }

        if (IsDefaultInitiative(initiative))
        {
            return (false, "Die Default-Initiative kann nicht gelöscht werden.");
        }

        var defaultInitiative = await db.Initiativen.FirstOrDefaultAsync(
            item => item.Name == DefaultInitiativeName,
            cancellationToken
        );

        if (defaultInitiative is null)
        {
            return (false, "Die Default-Initiative wurde nicht gefunden.");
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var initiativeId = initiative.Id;
            var defaultInitiativeId = defaultInitiative.Id;

            await db.Benutzer
                .Where(item => item.InitiativeId == initiativeId)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.InitiativeId, defaultInitiativeId),
                    cancellationToken
                );

            await db.FahrerFahrzeuge
                .Where(item => item.Fahrzeug.InitiativeId == initiativeId)
                .ExecuteDeleteAsync(cancellationToken);

            await db.Benachrichtigungen
                .Where(item => item.InitiativeId == initiativeId)
                .ExecuteDeleteAsync(cancellationToken);

            await db.Wartungen
                .Where(item => item.InitiativeId == initiativeId)
                .ExecuteDeleteAsync(cancellationToken);

            await db.Schaeden
                .Where(item => item.InitiativeId == initiativeId)
                .ExecuteDeleteAsync(cancellationToken);

            await db.Loeschfristen
                .Where(item => item.InitiativeId == initiativeId)
                .ExecuteDeleteAsync(cancellationToken);

            await db.Fahrten
                .Where(item => item.InitiativeId == initiativeId)
                .ExecuteDeleteAsync(cancellationToken);

            await db.Fahrgaeste
                .Where(item => item.InitiativeId == initiativeId)
                .ExecuteDeleteAsync(cancellationToken);

            await db.Fahrzeuge
                .Where(item => item.InitiativeId == initiativeId)
                .ExecuteDeleteAsync(cancellationToken);

            db.Initiativen.Remove(initiative);
            await db.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
            return (true, null);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static bool IsDefaultInitiative(Initiativen initiative)
        => string.Equals(initiative.Name?.Trim(), DefaultInitiativeName, StringComparison.OrdinalIgnoreCase);
}
using BuergerbusAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace BuergerbusAPI.Services;

public class TemporaryParticipantCleanupService : ITemporaryParticipantCleanupService
{
    private const int AnonymisierungsfristInTagen = 7;
    private const string FahrtAbgeschlossenStatus = "Abgeschlossen";

    private readonly AppDbContext _context;
    private readonly ILogger<TemporaryParticipantCleanupService> _logger;

    public TemporaryParticipantCleanupService(
        AppDbContext context,
        ILogger<TemporaryParticipantCleanupService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> AnonymisiereTemporaereFahrtTeilnehmerAsync(CancellationToken cancellationToken = default)
    {
        var grenze = DateTime.UtcNow.AddDays(-AnonymisierungsfristInTagen);

        var teilnehmer = await _context.FahrtTeilnehmer
            .Include(t => t.Fahrt)
            .Where(t =>
                t.IstTemporaer &&
                t.FahrgastId == null &&
                t.AnonymisiertAm == null &&
                t.Fahrt.Status == FahrtAbgeschlossenStatus &&
                (t.Fahrt.Endzeit ?? t.Fahrt.Startzeit) <= grenze)
            .ToListAsync(cancellationToken);

        var anzahlTeilnehmer = teilnehmer.Count;

        if (anzahlTeilnehmer == 0)
        {
            return 0;
        }

        var teilnehmerIds = teilnehmer.Select(t => t.Id).ToList();
        var teilstrecken = await _context.Teilstrecken
            .Where(ts => ts.FahrtTeilnehmerId.HasValue && teilnehmerIds.Contains(ts.FahrtTeilnehmerId.Value))
            .ToListAsync(cancellationToken);

        var anonymisiertAm = DateTime.UtcNow;

        foreach (var teilnehmerEintrag in teilnehmer)
        {
            teilnehmerEintrag.Vorname = "Gelöschter";
            teilnehmerEintrag.Nachname = "Fahrgast";
            teilnehmerEintrag.Telefonnummer = null;
            teilnehmerEintrag.Adresse = null;
            teilnehmerEintrag.AnonymisiertAm = anonymisiertAm;
        }

        foreach (var teilstrecke in teilstrecken)
        {
            teilstrecke.Abholadresse = null;
            teilstrecke.Zieladresse = null;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "{Anzahl} temporäre Fahrtteilnehmer wurden anonymisiert.",
            anzahlTeilnehmer);

        return anzahlTeilnehmer;
    }
}
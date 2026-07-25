using BuergerbusAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace BuergerbusAPI.Services;

public class TemporaryParticipantCleanupService : ITemporaryParticipantCleanupService
{
    private const string FahrtAbgeschlossenStatus = "Abgeschlossen";

    private readonly AppDbContext _context;
    private readonly ILogger<TemporaryParticipantCleanupService> _logger;
    private readonly SystemSettingsService _settingsService;

    public TemporaryParticipantCleanupService(
        AppDbContext context,
        ILogger<TemporaryParticipantCleanupService> logger,
        SystemSettingsService settingsService)
    {
        _context = context;
        _logger = logger;
        _settingsService = settingsService;
    }

    public async Task<int> CleanupAsync(CancellationToken cancellationToken = default)
    {
        var settings = await _settingsService.GetAsync(cancellationToken);
        var grenze = DateTime.UtcNow.AddDays(-settings.TemporaryParticipantRetentionDays);

        _logger.LogInformation(
            "Starte Cleanup temporärer Fahrtteilnehmer. Grenze: {Grenze}",
            grenze);

        var teilnehmer = await _context.FahrtTeilnehmer
            .Include(t => t.Fahrt)
            .Where(t =>
                t.IstTemporaer &&
                t.FahrgastId == null &&
                t.AnonymisiertAm == null &&
                t.Fahrt != null &&
                t.Fahrt.Status == FahrtAbgeschlossenStatus &&
                (t.Fahrt.Endzeit ?? t.Fahrt.Startzeit) <= grenze)
            .ToListAsync(cancellationToken);

        var anzahlTeilnehmer = teilnehmer.Count;

        _logger.LogInformation(
            "{Anzahl} temporäre Fahrtteilnehmer zur Anonymisierung gefunden.",
            anzahlTeilnehmer);

        if (anzahlTeilnehmer == 0)
        {
            _logger.LogInformation("Cleanup abgeschlossen. 0 Fahrtteilnehmer anonymisiert.");
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
            teilstrecke.Abholadresse = "Anonymisiert";
            teilstrecke.Zieladresse = "Anonymisiert";
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Cleanup abgeschlossen. {Anzahl} Fahrtteilnehmer anonymisiert.",
            anzahlTeilnehmer);

        return anzahlTeilnehmer;
    }
}

using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace BuergerbusAPI.Services;

/// <summary>Checks half-open ride intervals. Adjacent rides are allowed.</summary>
public sealed class RideConflictService(AppDbContext db)
{
    public async Task<string?> ValidateAsync(FahrtMetaDto ride, int initiativeId, int? ignoreRideId, bool isRental)
    {
        if (!ride.FahrzeugId.HasValue || ride.Startzeit == default)
            return null;

        var exclusiveEnd = ride.Endzeit ?? (ride.DatumBis?.Date.AddDays(1) ?? ride.Startzeit.Date.AddDays(1));
        if (exclusiveEnd <= ride.Startzeit)
            return null; // Time validation reports this more clearly.

        var occupied = db.Fahrten.AsNoTracking().Where(f =>
            f.InitiativeId == initiativeId &&
            (!ignoreRideId.HasValue || f.Id != ignoreRideId.Value) &&
            f.Status != "Storniert" && f.Status != "Cancelled" &&
            f.Status != "Gelöscht" && f.Status != "Deleted" &&
            f.Startzeit < exclusiveEnd &&
            (f.Endzeit ?? (f.DatumBis.HasValue ? f.DatumBis.Value.Date.AddDays(1) : f.Startzeit.Date.AddDays(1))) > ride.Startzeit);

        if (await occupied.AnyAsync(f => f.FahrzeugId == ride.FahrzeugId.Value))
            return isRental ? "Das ausgewählte Fahrzeug ist in diesem Zeitraum bereits vermietet." : "Das ausgewählte Fahrzeug ist in diesem Zeitraum bereits belegt.";

        if (!isRental && ride.FahrerId.HasValue && await occupied.AnyAsync(f => f.FahrerId == ride.FahrerId.Value))
            return "Der ausgewählte Fahrer ist in diesem Zeitraum bereits eingeplant.";

        return null;
    }
}

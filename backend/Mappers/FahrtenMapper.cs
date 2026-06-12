using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;

namespace BuergerbusAPI.Mappers;

public static class FahrtenMapper
{
    public static FahrtenDto ToDto(Fahrten f)
    {
        var teilnehmer = (f.Teilnehmer ?? new List<FahrtTeilnehmer>())
            .Select(ToDto)
            .OrderBy(tp => tp.Id)
            .ToList();

        return new FahrtenDto(
            f.Id,
            f.Titel,
            f.Datum,
            f.DatumBis,
            f.Zielort,
            f.Fahrttyp,
            f.Startzeit,
            f.Endzeit,
            f.Bemerkung,
            f.Status,
            f.AngelegtAm,
            f.AngelegtVonUserId,
            f.AngelegtVonUser?.Nutzername ?? string.Empty,
            f.FahrerId,
            f.FahrzeugId,
            f.InitiativeId,
            teilnehmer
        );
    }

    public static FahrtTeilnehmerDto ToDto(FahrtTeilnehmer teilnehmer)
    {
        return new FahrtTeilnehmerDto(
            teilnehmer.Id,
            teilnehmer.FahrtId,
            teilnehmer.FahrgastId,
            teilnehmer.Vorname,
            teilnehmer.Nachname,
            teilnehmer.Adresse,
            teilnehmer.Telefonnummer,
            teilnehmer.IstAbgehakt,
            teilnehmer.AbgehaktAm,
            teilnehmer.IstTemporaer,
            teilnehmer.AlsStammgastGespeichert,
            (teilnehmer.Teilstrecken ?? new List<Teilstrecke>())
                .OrderBy(t => t.Startzeit)
                .Select(ToDto)
                .ToList()
        );
    }

    public static TeilstreckeDto ToDto(Teilstrecke t)
    {
        return new TeilstreckeDto(
            t.Id,
            t.FahrtTeilnehmerId ?? 0,
            t.Abholadresse,
            t.Zieladresse,
            t.Startzeit,
            t.Endzeit,
            t.Reihenfolge,
            t.Status,
            t.FahrgastId,
            t.Fahrgast == null
                ? null
                : new FahrgastDto(
                    t.Fahrgast.Id,
                    t.Fahrgast.Vorname,
                    t.Fahrgast.Nachname,
                    t.Fahrgast.Adresse,
                    t.Fahrgast.Email,
                    t.Fahrgast.Telefonnummer,
                    t.Fahrgast.Bemerkung,
                    t.Fahrgast.AngelegtAm,
                    t.Fahrgast.GeaendertAm,
                    t.Fahrgast.LetzteNutzung,
                    t.Fahrgast.Aktiv,
                    t.Fahrgast.InitiativeId,
                    t.Fahrgast.Initiative?.Name
                )
        );
    }

    public static Fahrten ToEntity(CreateFahrtRequest request)
    {
        return new Fahrten
        {
            Titel = request.Fahrt.Titel,
            Datum = request.Fahrt.Datum,
            DatumBis = request.Fahrt.DatumBis,
            Zielort = request.Fahrt.Zielort,
            Fahrttyp = request.Fahrt.Fahrttyp,
            Startzeit = request.Fahrt.Startzeit,
            Endzeit = request.Fahrt.Endzeit,
            Bemerkung = request.Fahrt.Bemerkung,
            Status = request.Fahrt.Status,
            FahrerId = request.Fahrt.FahrerId,
            FahrzeugId = request.Fahrt.FahrzeugId,
        };
    }

    public static FahrtTeilnehmer ToEntity(CreateFahrtTeilnehmerDto dto)
    {
        return new FahrtTeilnehmer
        {
            FahrgastId = dto.FahrgastId,
            Vorname = dto.Vorname,
            Nachname = dto.Nachname,
            Adresse = dto.Adresse,
            Telefonnummer = dto.Telefonnummer,
            IstAbgehakt = false,
            AbgehaktAm = null,
            IstTemporaer = dto.FahrgastId is null && !dto.AlsStammgastSpeichern,
            AlsStammgastGespeichert = dto.AlsStammgastSpeichern,
        };
    }

    public static Teilstrecke ToEntity(CreateFahrtTeilnehmerDto dto, int teilnehmerIndex, int teilnehmerId = 0)
    {
        return new Teilstrecke
        {
            Abholadresse = dto.Abholadresse,
            Zieladresse = dto.Zieladresse,
            Startzeit = dto.Startzeit,
            Endzeit = dto.Endzeit,
            Reihenfolge = dto.Reihenfolge ?? teilnehmerIndex,
            Status = dto.Status,
            FahrgastId = dto.FahrgastId,
            FahrtTeilnehmerId = teilnehmerId > 0 ? teilnehmerId : null,
        };
    }
}
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;

namespace BuergerbusAPI.Mappers;

public static class FahrtenMapper
{
    // =========================================================
    // ENTITY -> DTO
    // =========================================================
    public static FahrtenDto ToDto(Fahrten f)
    {
        return new FahrtenDto(
            f.Id,
            f.Titel,
            f.Datum,
            f.Zielort,
            f.Fahrttyp,
            f.Startzeit,
            f.Endzeit,
            f.Bemerkung,
            f.Status,
            f.AngelegtAm,

            f.AngelegtVonUserId,

            f.AngelegtVonUser?.Nutzername ?? "",

            f.FahrerId,
            f.FahrzeugId,
            f.InitiativeId,

            (f.Teilstrecken ?? new List<Teilstrecke>())
                .OrderBy(t => t.Startzeit)
                .Select(ToDto)
                .ToList()
        );
    }

    // =========================================================
    // TEILSTRECKE ENTITY -> DTO
    // =========================================================
    public static TeilstreckeDto ToDto(Teilstrecke t)
    {
        return new TeilstreckeDto(
            t.Id,
            t.Abholadresse,
            t.Zieladresse,
            t.Startzeit,
            t.Endzeit,
            t.Reihenfolge,
            t.Status,
            t.FahrgastId,
            t.FahrtId,
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

    // =========================================================
    // CREATE DTO -> ENTITY
    // =========================================================
    public static Fahrten ToEntity(CreateFahrtenDto dto)
    {
        return new Fahrten
        {
            Titel = dto.Titel,
            Datum = dto.Datum,
            Zielort = dto.Zielort,
            Fahrttyp = dto.Fahrttyp,
            Startzeit = dto.Startzeit,
            Endzeit = dto.Endzeit,
            Bemerkung = dto.Bemerkung,
            Status = dto.Status,

            AngelegtAm = dto.AngelegtAm,

            FahrerId = dto.FahrerId,
            FahrzeugId = dto.FahrzeugId,

            Teilstrecken = dto.Teilstrecken?
                .Select(ToEntity)
                .ToList() ?? new List<Teilstrecke>()
        };
    }

    // =========================================================
    // TEILSTRECKE DTO -> ENTITY
    // =========================================================
    public static Teilstrecke ToEntity(CreateTeilstreckeDto dto)
    {
        return new Teilstrecke
        {
            Abholadresse = dto.Abholadresse,
            Zieladresse = dto.Zieladresse,
            Startzeit = dto.Startzeit,
            Endzeit = dto.Endzeit,
            Reihenfolge = dto.Reihenfolge,
            Status = dto.Status,
            FahrgastId = dto.FahrgastId
        };
    }

    // =========================================================
    // UPDATE
    // =========================================================
    public static void ApplyUpdate(Fahrten f, UpdateFahrtenDto dto)
    {
        f.Titel = dto.Titel;
        f.Datum = dto.Datum;
        f.Zielort = dto.Zielort;
        f.Fahrttyp = dto.Fahrttyp;
        f.Startzeit = dto.Startzeit;
        f.Endzeit = dto.Endzeit;
        f.Bemerkung = dto.Bemerkung;
        f.Status = dto.Status;

        f.FahrerId = dto.FahrerId;
        f.FahrzeugId = dto.FahrzeugId;

        f.Teilstrecken.Clear();

        foreach (var t in dto.Teilstrecken ?? new())
        {
            f.Teilstrecken.Add(ToEntity(t));
        }
    }
}
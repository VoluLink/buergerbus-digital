namespace BuergerbusAPI.DTOs;

public record FahrtenDto(
    int Id,
    string Titel,
    DateTime Datum,
    string Zielort,
    string Fahrttyp,
    DateTime Startzeit,
    DateTime? Endzeit,
    string? Bemerkung,
    string Status,
    DateTime AngelegtAm,
    int AngelegtVonUserId,
    string AngelegtVonUserName,
    int? FahrerId,
    int? FahrzeugId,
    int InitiativeId,
    List<FahrtTeilnehmerDto> Teilnehmer
);

public record FahrtMetaDto(
    string Titel,
    DateTime Datum,
    string Zielort,
    string Fahrttyp,
    DateTime Startzeit,
    DateTime? Endzeit,
    string? Bemerkung,
    string Status,
    int? FahrerId,
    int? FahrzeugId,
    int? InitiativeId
);

public record CreateFahrtRequest(
    FahrtMetaDto Fahrt,
    List<CreateFahrtTeilnehmerDto> Teilnehmer
);

public record UpdateFahrtRequest(
    FahrtMetaDto Fahrt,
    List<CreateFahrtTeilnehmerDto> Teilnehmer
);

public record FahrtTeilnehmerDto(
    int Id,
    int FahrtId,
    int? FahrgastId,
    string Vorname,
    string Nachname,
    string? Adresse,
    string? Telefonnummer,
    bool IstTemporaer,
    bool AlsStammgastGespeichert,
    List<TeilstreckeDto> Teilstrecken
);

public record CreateFahrtTeilnehmerDto(
    int? FahrgastId,
    string Vorname,
    string Nachname,
    string? Adresse,
    string? Telefonnummer,
    bool AlsStammgastSpeichern,
    string Abholadresse,
    string Zieladresse,
    DateTime? Startzeit,
    DateTime? Endzeit,
    int? Reihenfolge,
    string? Status
);

public record TeilstreckeDto(
    int Id,
    int FahrtTeilnehmerId,
    string Abholadresse,
    string Zieladresse,
    DateTime? Startzeit,
    DateTime? Endzeit,
    int? Reihenfolge,
    string? Status,
    int? FahrgastId,
    FahrgastDto? Fahrgast
);
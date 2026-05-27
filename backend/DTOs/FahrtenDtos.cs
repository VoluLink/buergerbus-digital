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
    string AngelegtVon,

    int? FahrerId,
    int? FahrzeugId,

    int InitiativeId,
    List<TeilstreckeDto> Teilstrecken
);

public record CreateFahrtenDto(
    string Titel,
    DateTime Datum,
    string Zielort,
    string Fahrttyp,
    DateTime Startzeit,
    DateTime? Endzeit,
    string? Bemerkung,
    string Status,
    string AngelegtVon,

    int? FahrerId,     // optional
    int? FahrzeugId,   // optional

    int InitiativeId,
    List<CreateTeilstreckeDto> Teilstrecken
);

public record UpdateFahrtenDto(
    string Titel,
    DateTime Datum,
    string Zielort,
    string Fahrttyp,
    DateTime Startzeit,
    DateTime? Endzeit,
    string? Bemerkung,
    string Status,

    int? FahrerId,     // optional (Zuweisung später möglich)
    int? FahrzeugId,   // optional

    int InitiativeId
);

public record TeilstreckeDto(
    int Id,
    string Abholadresse,
    string Zieladresse,
    DateTime? Startzeit,
    DateTime? Endzeit,
    int? Reihenfolge,
    string? Status,
    int FahrgastId,
    int FahrtId,
    FahrgastDto? Fahrgast
);

public record CreateTeilstreckeDto(
    string Abholadresse,
    string Zieladresse,
    DateTime? Startzeit,
    DateTime? Endzeit,
    int? Reihenfolge,
    string? Status,
    int FahrgastId
);
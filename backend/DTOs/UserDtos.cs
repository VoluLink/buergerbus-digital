namespace BuergerbusAPI.DTOs;
/// <summary>
/// Enthält DTOs für Benutzerprofile, Benutzerlisten,
/// Rolleninformationen und fahrerspezifische Profildaten.
/// </summary>
public record UserSummaryDto(
    int Id,
    string Username,
    string Email,
    InitiativeDto? Initiative,
    List<string> Roles,
    int? FahrerId,
    bool IsActive
);

public record UserProfileDto(
    int Id,
    string Username,
    string Email,
    string? Vorname,
    string? Nachname,
    string? Strasse,
    string? Postleitzahl,
    string? Ort,
    string? Fuehrerscheinklasse,
    DateTime? LetzteG25,
    DateTime? NaechsteG25,
    string? Telefonnummer,
    string? Bemerkung,
    bool Aktiv,
    InitiativeDto? Initiative,
    List<string> Roles,
    FahrerProfileDto? Fahrer
);

public record UserRolesDto(int UserId, List<string> Roles);

public record FahrerProfileDto(
    int Id,
    string? Bemerkung,
    bool Aktiv
);

public record UpdateUserProfileRequest(
    string? Vorname,
    string? Nachname,
    string Username,
    string? Strasse,
    string? Postleitzahl,
    string? Ort,
    string? Fuehrerscheinklasse,
    DateTime? LetzteG25,
    DateTime? NaechsteG25,
    string? Telefonnummer,
    string? Bemerkung,
    bool Aktiv,
    UpdateFahrerProfileRequest? Fahrer
);

public record UpdateFahrerProfileRequest(
    string? Bemerkung,
    bool Aktiv
);

public record UpdateRolesRequest(List<string> Roles);

public record CreateBenutzerRequest(
    string Name,
    string Email,
    string Password,
    int RoleId,
    int InitiativeId
);

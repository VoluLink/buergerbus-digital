using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using BuergerbusAPI.Services;
/// <summary>
/// Wandelt Benutzer-Entitäten aus der Datenbank in API-DTOs um.
/// Erstellt vollständige Benutzerprofile inklusive Rollen,
/// Initiative und optionalen Fahrerinformationen.
/// </summary>
namespace BuergerbusAPI.Mappers;

public static class UserMapper
{
    private static string? GetActiveRole(IReadOnlyCollection<string> roles)
    {
        return RolePriorityResolver.ResolveHighestRole(roles);
    }

    public static UserProfileDto CreateUserProfile(Benutzer user)
    {
        var roles = user.BenutzerRollen
            .Select(br => br.Rolle.Rollenname)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct()
            .ToList();

        var activeRole = GetActiveRole(roles);

        FahrerProfileDto? fahrer = null;
        if (user.Fahrer != null)
        {
            fahrer = new FahrerProfileDto(
                user.Fahrer.Id,
                user.Fahrer.Bemerkung,
                user.Fahrer.Aktiv
            );
        }

        var initiative = user.Initiative == null
            ? null
            : new InitiativeDto(user.Initiative.Id, user.Initiative.Name);

        return new UserProfileDto(
            user.Id,
            user.Nutzername,
            user.Email,
            user.Vorname,
            user.Nachname,
            user.Strasse,
            user.Postleitzahl,
            user.Ort,
            user.Fuehrerscheinklasse,
            user.LetzteG25,
            user.NaechsteG25,
            user.Telefonnummer,
            user.Bemerkung,
            user.Aktiv,
            initiative,
            roles,
            activeRole,
            fahrer
        );
    }
}

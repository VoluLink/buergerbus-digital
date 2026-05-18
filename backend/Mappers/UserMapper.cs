using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
/// <summary>
/// Wandelt Benutzer-Entitäten aus der Datenbank in API-DTOs um.
/// Erstellt vollständige Benutzerprofile inklusive Rollen,
/// Initiative und optionalen Fahrerinformationen.
/// </summary>
namespace BuergerbusAPI.Mappers;

public static class UserMapper
{
    public static UserProfileDto CreateUserProfile(Benutzer user)
    {
        var roles = user.BenutzerRollen
            .Select(br => br.Rolle.Rollenname)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct()
            .ToList();

        FahrerProfileDto? fahrer = null;
        if (user.Fahrer != null)
        {
            fahrer = new FahrerProfileDto(
                user.Fahrer.Id,
                user.Fahrer.Fuehrerscheinklasse,
                user.Fahrer.LetzteG25,
                user.Fahrer.NaechsteG25,
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
            user.Adresse,
            user.Telefonnummer,
            user.Bemerkung,
            user.Aktiv,
            initiative,
            roles,
            fahrer
        );
    }
}

using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;

namespace BuergerbusAPI.Mappers;

public static class FahrgastMapper
{
    public static FahrgastDto CreateFahrgast(Fahrgast f)
    {
        return new FahrgastDto(
            f.Id,
            f.Vorname,
            f.Nachname,
            f.Adresse,
            f.Email,
            f.Telefonnummer,
            f.Bemerkung,
            f.AngelegtAm,
            f.GeaendertAm,
            f.LetzteNutzung,
            f.Aktiv,
            f.InitiativeId,
            f.Initiative?.Name
        );
    }
}
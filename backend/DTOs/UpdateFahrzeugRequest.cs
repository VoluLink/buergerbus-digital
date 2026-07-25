namespace BuergerbusAPI.DTOs;
public record UpdateFahrzeugRequest(string Kennzeichen,string Bezeichnung,byte Kapazitaet,int Kilometerstand,DateTime Betriebsaufnahme,int InitiativeId,string? Bemerkung,string? Status);

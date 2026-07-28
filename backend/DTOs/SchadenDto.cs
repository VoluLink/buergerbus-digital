namespace BuergerbusAPI.DTOs; public record SchadenDto(int Id,int FahrzeugId,int InitiativeId,string Beschreibung,DateTime EntstandenAm,DateTime? BehobenAm,string Status);

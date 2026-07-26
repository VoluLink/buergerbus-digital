using BuergerbusAPI.Models; namespace BuergerbusAPI.DTOs; public record PublicFooterLinkDto(string Label,string Url,bool IsExternal,bool OpenInNewTab,int SortOrder);

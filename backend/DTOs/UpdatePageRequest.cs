namespace BuergerbusAPI.DTOs; public record UpdatePageRequest(string Slug,string Title,string Content,bool IsPublished,bool ShowInFooter,int? FooterSortOrder);

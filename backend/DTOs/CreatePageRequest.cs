namespace BuergerbusAPI.DTOs; public record CreatePageRequest(string Slug,string Title,string Content,bool IsPublished,bool ShowInFooter,int? FooterSortOrder);

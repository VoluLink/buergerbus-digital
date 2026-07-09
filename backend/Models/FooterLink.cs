namespace BuergerbusAPI.Models
{
    public class FooterLink
    {
        public Guid Id { get; set; }

        public string Label { get; set; } = string.Empty;

        public FooterLinkType LinkType { get; set; }

        public Guid? SitePageId { get; set; }

        public SitePage? SitePage { get; set; }

        public string? ExternalUrl { get; set; }

        public int SortOrder { get; set; }

        public bool IsActive { get; set; }

        public bool OpenInNewTab { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public Guid? UpdatedByUserId { get; set; }
    }
}
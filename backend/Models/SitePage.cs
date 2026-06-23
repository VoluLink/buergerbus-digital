namespace BuergerbusAPI.Models
{
    public class SitePage
    {
        public Guid Id { get; set; }

        public string Slug { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public bool IsPublished { get; set; }

        public bool ShowInFooter { get; set; }

        public int? FooterSortOrder { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public Guid? UpdatedByUserId { get; set; }
    }
}
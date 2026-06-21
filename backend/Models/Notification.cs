namespace BuergerbusAPI.Models
{
    public class Notification
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public string RecipientGroup { get; set; } = string.Empty;

        public List<NotificationRecipient> Recipients { get; set; } = new();
    }
}
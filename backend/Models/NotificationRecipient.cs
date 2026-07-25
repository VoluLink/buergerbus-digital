namespace BuergerbusAPI.Models
{
    public class NotificationRecipient
    {
        public Guid Id { get; set; }
        public Guid NotificationId { get; set; }
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime CreatedAt { get; set; }

        public Notification? Notification { get; set; }
    }
}

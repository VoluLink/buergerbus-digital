namespace BuergerbusAPI.Models;
public class EmailTemplate
{
    public int Id { get; set; }
    public string TemplateType { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Heading { get; set; } = string.Empty;
    public string Intro { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Closing { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
    public string Footer { get; set; } = string.Empty;
    public DateTime UpdatedAtUtc { get; set; }
    public int? UpdatedByUserId { get; set; }
}

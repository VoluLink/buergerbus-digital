namespace BuergerbusAPI.DTOs;
public sealed record EmailTemplateDto(int Id, string TemplateType, string Subject, string Heading, string Intro, string Body, string Closing, string Signature, string Footer, DateTime UpdatedAtUtc);
public sealed record EmailTemplateAdminDto(int Id, string TemplateType, string DisplayName, string Description, string[] AllowedPlaceholders, string[] RequiredPlaceholders, string Subject, string Heading, string Intro, string Body, string Closing, string Signature, string Footer, DateTime UpdatedAtUtc);

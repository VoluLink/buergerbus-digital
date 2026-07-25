namespace BuergerbusAPI.DTOs;
public sealed record EmailTemplateDto(int Id, string TemplateType, string Subject, string Heading, string Intro, string Body, string Closing, string Signature, string Footer, DateTime UpdatedAtUtc);

using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace BuergerbusAPI.Services;

public class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(EmailSettings settings, ILogger<SmtpEmailService> logger)
    {
        _settings = settings;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = ToPlainText(htmlBody)
        }.ToMessageBody();

        using var client = new SmtpClient();
        client.Timeout = 30_000;
        var secureSocketOptions = _settings.UseSsl
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTlsWhenAvailable;

        await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, secureSocketOptions);

        if (!string.IsNullOrWhiteSpace(_settings.Username))
        {
            await client.AuthenticateAsync(_settings.Username, _settings.Password);
        }

        try
        {
            await client.SendAsync(message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fehler beim SMTP-Versand.");
            throw;
        }
        finally
        {
            await client.DisconnectAsync(true);
        }
    }

    private static string ToPlainText(string html) =>
        System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", string.Empty)
            .Replace("&nbsp;", " ", StringComparison.Ordinal)
            .Replace("&amp;", "&", StringComparison.Ordinal)
            .Trim();
}

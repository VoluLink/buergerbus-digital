using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Mappers;
using BuergerbusAPI.Models;
using BuergerbusAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
/// <summary>
/// Enthält API-Endpunkte für Authentifizierung.
/// Aktuell wird hier der Login-Prozess implementiert.
/// </summary>
namespace BuergerbusAPI.Endpoints;

public static class AuthEndpoints
{
    private const int MinPasswordLength = 6;

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/login", async (
            LoginRequest request,
            HttpContext httpContext,
            AppDbContext db,
            IPasswordHasher<Benutzer> passwordHasher,
            JwtService jwtService,
            RefreshSessionService refreshSessions,
            AuditService audit
        ) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return Results.BadRequest("E-Mail oder Benutzername und Passwort sind erforderlich.");
            }

            var identifier = request.Email.Trim();
            var normalizedIdentifier = identifier.ToLowerInvariant();

            var user = await db.Benutzer
                .Include(u => u.Initiative)
                .Include(u => u.BenutzerRollen)
                    .ThenInclude(br => br.Rolle)
                .Include(u => u.Fahrer)
                .FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == normalizedIdentifier
                    || u.Nutzername.ToLower() == normalizedIdentifier);

            if (user is null)
            {
                await audit.WriteAsync("login", "Benutzer", "failed", metadata: new { reason = "invalid_credentials" });
                return Results.Text(
                    "Ungültige Zugangsdaten.",
                    statusCode: StatusCodes.Status401Unauthorized
                );
            }

            if (!user.Aktiv)
            {
                await audit.WriteAsync("login", "Benutzer", "failed", user.Id, user.Id.ToString(), user.InitiativeId, new { reason = "invalid_credentials" });
                return Results.Text(
                    "UngÃ¼ltige Zugangsdaten.",
                    statusCode: StatusCodes.Status401Unauthorized
                );
            }

            var passwordResult = passwordHasher.VerifyHashedPassword(user, user.PasswortHash, request.Password);

            if (passwordResult == PasswordVerificationResult.Failed)
            {
                await audit.WriteAsync("login", "Benutzer", "failed", user.Id, user.Id.ToString(), user.InitiativeId, new { reason = "invalid_credentials" });
                return Results.Text(
                    "Ungültige Zugangsdaten.",
                    statusCode: StatusCodes.Status401Unauthorized
                );
            }

            if (passwordResult == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswortHash = passwordHasher.HashPassword(user, request.Password);
                await db.SaveChangesAsync();
            }

            var token = await jwtService.CreateTokenAsync(user.Id);
            var refresh = await refreshSessions.CreateAsync(user, httpContext);
            refreshSessions.WriteCookie(httpContext.Response, refresh.Token, refresh.Session.ExpiresAtUtc);
            await audit.WriteAsync("RefreshSessionCreated", "RefreshSession", "success", user.Id, refresh.Session.Id.ToString(), user.InitiativeId);
            await audit.WriteAsync("login", "Benutzer", "success", user.Id, user.Id.ToString(), user.InitiativeId);

            return Results.Ok(new LoginResponseDto(
                true,
                "Login erfolgreich.",
                token,
                UserMapper.CreateUserProfile(user)));
        }).RequireRateLimiting("auth-login");

        app.MapPost("/api/v1/auth/refresh", async (HttpContext context, JwtService jwtService, RefreshSessionService refreshSessions, AuditService audit, CancellationToken ct) =>
        {
            var rotated = await refreshSessions.RotateAsync(RefreshSessionService.ReadCookie(context.Request), context, ct);
            if (rotated is null) { refreshSessions.DeleteCookie(context.Response); return Results.Unauthorized(); }
            refreshSessions.WriteCookie(context.Response, rotated.Value.Token, rotated.Value.New.ExpiresAtUtc);
            await audit.WriteAsync("RefreshSessionRotated", "RefreshSession", "success", rotated.Value.User.Id, rotated.Value.New.Id.ToString(), rotated.Value.User.InitiativeId, new { sessionId = rotated.Value.New.Id });
            return Results.Ok(new RefreshTokenResponseDto(await jwtService.CreateTokenAsync(rotated.Value.User.Id, ct)));
        });
        app.MapPost("/api/v1/auth/logout", async (HttpContext context, RefreshSessionService refreshSessions, AuditService audit, CancellationToken ct) =>
        {
            var token=RefreshSessionService.ReadCookie(context.Request); await refreshSessions.RevokeAsync(token,"logout",ct); refreshSessions.DeleteCookie(context.Response); var userId=AuthUtils.GetUserId(context.User); if(userId.HasValue) await audit.WriteAsync("Logout","RefreshSession","success",userId.Value); return Results.NoContent();
        });

        app.MapPost("/api/v1/auth/forgot-password", async (
            ForgotPasswordRequest request,
            AppDbContext db,
            EmailSettings emailSettings,
            EmailOutboxService outbox,
            EmailTemplateService templates,
            ILoggerFactory loggerFactory,
            AuditService audit) =>
        {
            var logger = loggerFactory.CreateLogger("AuthEndpoints");
            const string neutralResponse = "Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail zum Zurücksetzen versendet.";

            var email = request.Email?.Trim();
            if (string.IsNullOrWhiteSpace(email))
            {
                return Results.BadRequest("E-Mail ist erforderlich.");
            }

            try
            {
                _ = new MailAddress(email);
            }
            catch
            {
                return Results.BadRequest("E-Mail ist ungültig.");
            }

            try
            {
                var normalizedEmail = email.ToLowerInvariant();
                var user = await db.Benutzer.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

                if (user is not null)
                {
                    var token = CreatePasswordResetToken();
                    var tokenHash = HashToken(token);

                    var existingTokens = await db.PasswordResetTokens
                        .Where(t => t.UserId == user.Id && t.UsedAt == null)
                        .ToListAsync();

                    if (existingTokens.Count > 0)
                    {
                        db.PasswordResetTokens.RemoveRange(existingTokens);
                    }

                    db.PasswordResetTokens.Add(new PasswordResetToken
                    {
                        UserId = user.Id,
                        TokenHash = tokenHash,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                        CreatedAt = DateTime.UtcNow,
                    });

                    await db.SaveChangesAsync();

                    var resetLink = BuildResetLink(emailSettings.FrontendUrl, token);
                    var rendered = await templates.RenderAsync("PasswordReset", new PasswordResetTemplateContext(user.Nutzername, resetLink, "60", user.Initiative?.Name ?? "Bürgerbus", "Bürgerbus-Team"));
                    await outbox.EnqueueAsync("PasswordReset", user.Email, user.Nutzername, rendered.Subject, rendered.Html, initiativeId: user.InitiativeId);
                    await audit.WriteAsync("password_reset_requested", "Benutzer", "success", user.Id, user.Id.ToString(), user.InitiativeId);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Fehler beim Anlegen oder Senden des Passwort-Reset-Tokens.");
            }

            return Results.Ok(new { message = neutralResponse });
        }).RequireRateLimiting("auth-forgot-password");

        app.MapPost("/api/v1/auth/reset-password", async (
            ResetPasswordRequest request,
            AppDbContext db,
            IPasswordHasher<Benutzer> passwordHasher,
            RefreshSessionService refreshSessions,
            AuditService audit) =>
        {
            if (string.IsNullOrWhiteSpace(request.Token))
            {
                return Results.BadRequest("Token ist erforderlich.");
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return Results.BadRequest("Neues Passwort ist erforderlich.");
            }

            var newPassword = request.NewPassword.Trim();
            if (newPassword.Length < MinPasswordLength)
            {
                return Results.BadRequest("Passwort muss mindestens 6 Zeichen lang sein.");
            }

            var tokenHash = HashToken(request.Token.Trim());
            var resetToken = await db.PasswordResetTokens
                .Include(t => t.Benutzer)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (resetToken is null || resetToken.UsedAt is not null || resetToken.ExpiresAt <= DateTime.UtcNow)
            {
                return Results.BadRequest("Token ist ungültig oder abgelaufen.");
            }

            var user = resetToken.Benutzer;
            if (user is null)
                return Results.Problem(statusCode: StatusCodes.Status500InternalServerError, title: "Inkonsistenter Passwort-Reset-Datensatz");
            user.PasswortHash = passwordHasher.HashPassword(user, newPassword);
            user.AuthVersion++;
            await refreshSessions.RevokeAllAsync(user.Id, "password_reset");
            resetToken.UsedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            await audit.WriteAsync("password_reset", "Benutzer", "success", user.Id, user.Id.ToString(), user.InitiativeId);

            return Results.Ok(new { message = "Passwort wurde erfolgreich zurückgesetzt." });
        }).RequireRateLimiting("auth-reset-password");

        app.MapPost("/api/v1/auth/change-password", async (
            ChangePasswordRequest request,
            HttpContext httpContext,
            AppDbContext db,
            IPasswordHasher<Benutzer> passwordHasher,
            RefreshSessionService refreshSessions,
            AuditService audit) =>
        {
            var principal = httpContext.User;
            var currentUserId = AuthUtils.GetUserId(principal);

            if (!currentUserId.HasValue)
            {
                return Results.Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            {
                return Results.BadRequest("Aktuelles Passwort ist erforderlich.");
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return Results.BadRequest("Neues Passwort ist erforderlich.");
            }

            var currentPassword = request.CurrentPassword.Trim();
            var newPassword = request.NewPassword.Trim();

            if (newPassword.Length < MinPasswordLength)
            {
                return Results.BadRequest("Passwort muss mindestens 6 Zeichen lang sein.");
            }

            if (string.Equals(currentPassword, newPassword, StringComparison.Ordinal))
            {
                return Results.BadRequest("Neues Passwort darf nicht dem aktuellen Passwort entsprechen.");
            }

            var user = await db.Benutzer.FirstOrDefaultAsync(u => u.Id == currentUserId.Value);
            if (user is null || !user.Aktiv)
            {
                return Results.Unauthorized();
            }

            var verificationResult = passwordHasher.VerifyHashedPassword(user, user.PasswortHash, currentPassword);
            if (verificationResult == PasswordVerificationResult.Failed)
            {
                return Results.BadRequest("Aktuelles Passwort ist falsch.");
            }

            user.PasswortHash = passwordHasher.HashPassword(user, newPassword);
            user.GeaendertAm = DateTime.UtcNow;
            user.AuthVersion++;
            await refreshSessions.RevokeAllAsync(user.Id, "password_changed");

            await db.SaveChangesAsync();
            await audit.WriteAsync("password_changed", "Benutzer", "success", user.Id, user.Id.ToString(), user.InitiativeId);

            return Results.Ok(new ChangePasswordResponse("Passwort wurde erfolgreich geändert."));
        })
        .Accepts<ChangePasswordRequest>("application/json")
        .Produces<ChangePasswordResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .RequireAuthorization();

        if (app.ServiceProvider.GetRequiredService<IHostEnvironment>().IsDevelopment())
        {
            app.MapGet("/api/v1/test", (HttpContext httpContext) =>
        {
            var userName = httpContext.User.Identity?.Name;

            return Results.Ok(new
            {
                Message = "Du bist eingeloggt!",
                User = userName
            });
            }).RequireAuthorization();
        }

        return app;
    }

    private static string CreatePasswordResetToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private static string HashToken(string token)
    {
        var tokenBytes = Encoding.UTF8.GetBytes(token);
        var hashBytes = SHA256.HashData(tokenBytes);
        return Convert.ToHexString(hashBytes);
    }

    private static string BuildResetLink(string frontendUrl, string token)
    {
        var baseUrl = frontendUrl.TrimEnd('/');
        return $"{baseUrl}/reset-password?token={Uri.EscapeDataString(token)}";
    }
}

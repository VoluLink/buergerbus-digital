using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Mappers;
using BuergerbusAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Enthält API-Endpunkte für Authentifizierung.
/// Aktuell wird hier der Login-Prozess implementiert.
/// </summary>
namespace BuergerbusAPI.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/login", async (
            LoginRequest request,
            AppDbContext db,
            IPasswordHasher<Benutzer> passwordHasher
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
                return Results.Text(
                    "Ungültige Zugangsdaten.",
                    statusCode: StatusCodes.Status401Unauthorized
                );
            }

            var passwordResult = passwordHasher.VerifyHashedPassword(user, user.PasswortHash, request.Password);

            if (passwordResult == PasswordVerificationResult.Failed)
            {
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

            return Results.Ok(new LoginResponseDto(
                true,
                "Login erfolgreich.",
                UserMapper.CreateUserProfile(user))
            );
        });

        return app;
    }
}

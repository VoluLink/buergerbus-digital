using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using BuergerbusAPI.Models;

namespace BuergerbusAPI.Services;

public class JwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    public string CreateToken(Benutzer user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["JWT_SECRET"]!)
        );

        var roles = user.BenutzerRollen
            .Where(r => r.Rolle is not null)
            .Select(r => r.Rolle!.Rollenname)
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Distinct()
            .ToList();
        var activeRole = RolePriorityResolver.ResolveHighestRole(roles);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("initiativeId", user.InitiativeId.ToString()),
            new Claim("authVersion", user.AuthVersion.ToString())
        };

        if (!string.IsNullOrWhiteSpace(activeRole))
        {
            claims.Add(new Claim(ClaimTypes.Role, activeRole));
            claims.Add(new Claim("activeRole", activeRole));
        }

        claims.AddRange(roles.Select(r => new Claim("roles", r)));

        var token = new JwtSecurityToken(
            issuer: _config["JWT_ISSUER"],
            audience: _config["JWT_AUDIENCE"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                int.Parse(_config["JWT_EXPIRES_MINUTES"] ?? "60")
            ),
            signingCredentials: new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            )
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

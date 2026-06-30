using System.Security.Claims;

namespace BuergerbusAPI.Services;

public static class AuthUtils
{
    public const string InitiativeIdClaim = "initiativeId";
    public const string AdminRole = "Admin";
    public const string DisponentRole = "Disponent";
    public const string FahrerRole = "Fahrer";
    public const string GastRole = "Gast";

    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        AdminRole,
        DisponentRole,
        FahrerRole,
        GastRole,
    };

    public static int? GetUserId(ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub");

        return int.TryParse(value, out var parsed) ? parsed : null;
    }

    public static int? GetInitiativeId(ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(InitiativeIdClaim);
        return int.TryParse(value, out var parsed) ? parsed : null;
    }

    public static bool IsKnownRole(string? role)
        => !string.IsNullOrWhiteSpace(role) && AllowedRoles.Contains(role.Trim());

    public static IReadOnlyCollection<string> GetAllowedRoles()
        => AllowedRoles;

    public static string? NormalizeRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return null;
        }

        var trimmed = role.Trim();
        return AllowedRoles.FirstOrDefault(allowed => string.Equals(allowed, trimmed, StringComparison.OrdinalIgnoreCase));
    }

    private static bool HasRole(ClaimsPrincipal principal, string role)
        => principal.IsInRole(role)
           || principal.FindAll("roles").Any(claim => string.Equals(claim.Value, role, StringComparison.OrdinalIgnoreCase))
           || principal.FindAll("activeRole").Any(claim => string.Equals(claim.Value, role, StringComparison.OrdinalIgnoreCase));

    public static bool IsAdmin(ClaimsPrincipal principal)
        => HasRole(principal, AdminRole);

    public static bool IsDisponent(ClaimsPrincipal principal)
        => HasRole(principal, DisponentRole);

    public static bool IsFahrer(ClaimsPrincipal principal)
        => HasRole(principal, FahrerRole);

    public static bool IsGast(ClaimsPrincipal principal)
        => HasRole(principal, GastRole);

    public static bool CanManageRides(ClaimsPrincipal principal)
        => IsAdmin(principal) || IsDisponent(principal);

    public static bool CanManagePassengers(ClaimsPrincipal principal)
        => IsAdmin(principal) || IsDisponent(principal);

    public static bool CanManageVehicles(ClaimsPrincipal principal)
        => IsAdmin(principal) || IsDisponent(principal);

    public static bool CanManageInitiatives(ClaimsPrincipal principal)
        => IsAdmin(principal);

    public static bool CanManageUsers(ClaimsPrincipal principal)
        => IsAdmin(principal) || IsDisponent(principal);
}

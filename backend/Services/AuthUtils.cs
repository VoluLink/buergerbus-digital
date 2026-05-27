using System.Security.Claims;

namespace BuergerbusAPI.Services;

public static class AuthUtils
{
    public const string InitiativeIdClaim = "initiativeId";

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

    public static bool IsAdmin(ClaimsPrincipal principal)
        => principal.IsInRole("Admin");
}

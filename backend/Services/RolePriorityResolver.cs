namespace BuergerbusAPI.Services;

public static class RolePriorityResolver
{
    public static string? ResolveHighestRole(IEnumerable<string?> roles)
    {
        return roles
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Select(role => role!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderByDescending(GetRank)
            .ThenBy(role => role, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();
    }

    private static int GetRank(string role)
    {
        return role.ToLowerInvariant() switch
        {
            "admin" => 3,
            "disponent" => 2,
            "fahrer" => 1,
            "gast" => 0,
            _ => -1,
        };
    }
}
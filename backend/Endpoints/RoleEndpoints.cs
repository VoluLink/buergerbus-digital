using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Enthält API-Endpunkte zum Abrufen verfügbarer Rollen.
/// </summary>
namespace BuergerbusAPI.Endpoints;

public static class RoleEndpoints
{
    public static IEndpointRouteBuilder MapRoleEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/roles", async (AppDbContext db) =>
        {
            var roles = await db.Rollen
                .AsNoTracking()
                .OrderBy(r => r.Rollenname)
                .Select(r => new RoleDto(r.Id, r.Rollenname))
                .ToListAsync();

            return Results.Ok(roles);
        })
        .RequireAuthorization();

        return app;
    }
}

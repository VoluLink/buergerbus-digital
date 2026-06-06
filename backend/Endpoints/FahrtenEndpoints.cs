using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Mappers;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BuergerbusAPI.Endpoints;

public static class FahrtenEndpoints
{
    public static IEndpointRouteBuilder MapFahrtenEndpoints(this IEndpointRouteBuilder app)
    {
        // =========================================================
        // GET ALL
        // =========================================================
        app.MapGet("/api/v1/fahrten", async (AppDbContext db) =>
        {
            var fahrten = await db.Fahrten
                .Include(f => f.Teilstrecken)
                    .ThenInclude(t => t.Fahrgast)
                .AsNoTracking()
                .OrderByDescending(f => f.Datum)
                .ToListAsync();

            return Results.Ok(fahrten.Select(FahrtenMapper.ToDto));
        });


        // =========================================================
        // GET BY ID
        // =========================================================
        app.MapGet("/api/v1/fahrten/{id:int}", async (int id, AppDbContext db) =>
        {
            var fahrt = await db.Fahrten
                .Include(f => f.Teilstrecken)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fahrt is null)
            return Results.NotFound("Fahrt wurde nicht gefunden.");

            fahrt.Teilstrecken = fahrt.Teilstrecken
                .OrderBy(t => t.Startzeit)
                .ToList();

            return Results.Ok(FahrtenMapper.ToDto(fahrt));
        });


        // =========================================================
        // CREATE
        // =========================================================
        app.MapPost("/api/v1/fahrten", async (
            CreateFahrtenDto request,
            AppDbContext db,
            HttpContext httpContext
        ) =>
        {
            try
            {
                var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                    return Results.Unauthorized();

                var initiativeClaim = httpContext.User.FindFirst("initiativeId");
                if (initiativeClaim == null)
                    return Results.Unauthorized();

                var userId = int.Parse(userIdClaim.Value);
                var initiativeId = int.Parse(initiativeClaim.Value);

                if (request.Teilstrecken == null)
                    return Results.BadRequest("Teilstrecken dürfen nicht null sein.");

                if (request.Teilstrecken.Count > 8)
                    return Results.BadRequest("Eine Fahrt darf maximal 8 Teilstrecken haben.");

                var fahrt = FahrtenMapper.ToEntity(request);

                // Werte ausschließlich aus dem JWT setzen
                fahrt.AngelegtVonUserId = userId;
                fahrt.InitiativeId = initiativeId;

                db.Fahrten.Add(fahrt);
                await db.SaveChangesAsync();

                await db.Entry(fahrt)
                    .Collection(f => f.Teilstrecken)
                    .Query()
                    .Include(t => t.Fahrgast)
                    .LoadAsync();

                await db.Entry(fahrt)
                    .Reference(f => f.AngelegtVonUser)
                    .LoadAsync();

                return Results.Ok(FahrtenMapper.ToDto(fahrt));
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        })
        .RequireAuthorization();


        // =========================================================
        // UPDATE
        // =========================================================
        app.MapPut("/api/v1/fahrten/{id:int}", async (int id, UpdateFahrtenDto request, AppDbContext db) =>
{
             var fahrt = await db.Fahrten
                .Include(f => f.Teilstrecken)
                .ThenInclude(t => t.Fahrgast)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fahrt is null)
            return Results.NotFound("Fahrt wurde nicht gefunden.");

            FahrtenMapper.ApplyUpdate(fahrt, request);

            await db.SaveChangesAsync();

            var reloaded = await db.Fahrten
            .Include(f => f.Teilstrecken)
            .ThenInclude(t => t.Fahrgast)
            .FirstOrDefaultAsync(f => f.Id == id);

            return Results.Ok(FahrtenMapper.ToDto(reloaded!));
        });


        // =========================================================
        // DELETE
        // =========================================================
        app.MapDelete("/api/v1/fahrten/{id:int}", async (int id, AppDbContext db) =>
        {
            var fahrt = await db.Fahrten
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fahrt is null)
                return Results.NotFound("Fahrt wurde nicht gefunden.");

            db.Fahrten.Remove(fahrt);
            await db.SaveChangesAsync();

            return Results.Ok("Fahrt wurde gelöscht.");
        });


        // =========================================================
        // ZUORDNUNG: Fahrer setzen (optional Feature)
        // =========================================================
        app.MapPatch("/api/v1/fahrten/{id:int}/fahrer/{fahrerId:int}", async (int id, int fahrerId, AppDbContext db) =>
        {
            var fahrt = await db.Fahrten.FirstOrDefaultAsync(f => f.Id == id);
            if (fahrt is null)
                return Results.NotFound("Fahrt wurde nicht gefunden.");

            var fahrerExists = await db.Fahrer.AnyAsync(f => f.Id == fahrerId);
            if (!fahrerExists)
                return Results.NotFound("Fahrer wurde nicht gefunden.");

            fahrt.FahrerId = fahrerId;

            await db.SaveChangesAsync();

            return Results.Ok("Fahrer wurde zugewiesen.");
        });


        // =========================================================
        // ZUORDNUNG: Fahrzeug setzen (optional Feature)
        // =========================================================
        app.MapPatch("/api/v1/fahrten/{id:int}/fahrzeug/{fahrzeugId:int}", async (int id, int fahrzeugId, AppDbContext db) =>
        {
            var fahrt = await db.Fahrten.FirstOrDefaultAsync(f => f.Id == id);
            if (fahrt is null)
                return Results.NotFound("Fahrt wurde nicht gefunden.");

            var fahrzeugExists = await db.Fahrzeuge.AnyAsync(f => f.Id == fahrzeugId);
            if (!fahrzeugExists)
                return Results.NotFound("Fahrzeug wurde nicht gefunden.");

            fahrt.FahrzeugId = fahrzeugId;

            await db.SaveChangesAsync();

            return Results.Ok("Fahrzeug wurde zugewiesen.");
        });

        return app;
    }
}
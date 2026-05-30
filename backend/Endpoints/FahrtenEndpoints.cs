using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Mappers;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;

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

            return Results.Ok(FahrtenMapper.ToDto(fahrt));
        });


        // =========================================================
        // CREATE
        // =========================================================
        app.MapPost("/api/v1/fahrten", async (CreateFahrtenDto request, AppDbContext db) =>
        {
            try
            {
                if (request.Teilstrecken == null)
                    return Results.BadRequest("Teilstrecken dürfen nicht null sein.");

                if (request.Teilstrecken.Count > 8)
                    return Results.BadRequest("Eine Fahrt darf maximal 8 Teilstrecken haben.");

                var fahrt = FahrtenMapper.ToEntity(request);

                db.Fahrten.Add(fahrt);
                await db.SaveChangesAsync();

                await db.Entry(fahrt)
                    .Collection(f => f.Teilstrecken)
                    .LoadAsync();

                return Results.Ok(FahrtenMapper.ToDto(fahrt));
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        });


        // =========================================================
        // UPDATE
        // =========================================================
        app.MapPut("/api/v1/fahrten/{id:int}", async (int id, UpdateFahrtenDto request, AppDbContext db) =>
        {
            var fahrt = await db.Fahrten
                .Include(f => f.Teilstrecken)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fahrt is null)
                return Results.NotFound("Fahrt wurde nicht gefunden.");

            FahrtenMapper.ApplyUpdate(fahrt, request);

            await db.SaveChangesAsync();

            return Results.Ok(FahrtenMapper.ToDto(fahrt));
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
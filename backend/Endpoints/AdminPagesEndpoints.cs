using BuergerbusAPI.DTOs;
using BuergerbusAPI.Services;

namespace BuergerbusAPI.Endpoints;

public static class AdminPagesEndpoints
{
    public static IEndpointRouteBuilder MapAdminPagesEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/admin/pages", async (
            PageService pageService,
            CancellationToken cancellationToken) =>
        {
            var pages = await pageService.GetAllAsync(cancellationToken);
            return Results.Ok(new { pages });
        })
        .RequireAuthorization("AdminOnly");

        app.MapGet("/api/v1/admin/pages/{id:guid}", async (
            Guid id,
            PageService pageService,
            CancellationToken cancellationToken) =>
        {
            var page = await pageService.GetByIdAsync(id, cancellationToken);
            return page is null ? Results.NotFound() : Results.Ok(page);
        })
        .RequireAuthorization("AdminOnly");

        app.MapPost("/api/v1/admin/pages", async (
            CreatePageRequest request,
            PageService pageService,
            CancellationToken cancellationToken) =>
        {
            var result = await pageService.CreateAsync(request, cancellationToken);
            return result.Ok ? Results.Ok(result.Page) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization("AdminOnly");

        app.MapPut("/api/v1/admin/pages/{id:guid}", async (
            Guid id,
            UpdatePageRequest request,
            PageService pageService,
            CancellationToken cancellationToken) =>
        {
            var result = await pageService.UpdateAsync(id, request, cancellationToken);
            return result.Ok ? Results.Ok(result.Page) : (result.Error == "Seite nicht gefunden." ? Results.NotFound(result.Error) : Results.BadRequest(result.Error));
        })
        .RequireAuthorization("AdminOnly");

        app.MapDelete("/api/v1/admin/pages/{id:guid}", async (
            Guid id,
            PageService pageService,
            CancellationToken cancellationToken) =>
        {
            var result = await pageService.DeleteAsync(id, cancellationToken);
            return result.Ok ? Results.NoContent() : (result.Error == "Seite nicht gefunden." ? Results.NotFound(result.Error) : Results.Conflict(result.Error));
        })
        .RequireAuthorization("AdminOnly");

        return app;
    }
}
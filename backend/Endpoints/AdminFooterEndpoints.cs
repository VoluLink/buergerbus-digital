using BuergerbusAPI.DTOs;
using BuergerbusAPI.Services;

namespace BuergerbusAPI.Endpoints;

public static class AdminFooterEndpoints
{
    public static IEndpointRouteBuilder MapAdminFooterEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/admin/footer-links", async (
            FooterService footerService,
            CancellationToken cancellationToken) =>
        {
            var links = await footerService.GetAllAsync(cancellationToken);
            return Results.Ok(new { links });
        })
        .RequireAuthorization("AdminOnly");

        app.MapGet("/api/v1/admin/footer-links/{id:guid}", async (
            Guid id,
            FooterService footerService,
            CancellationToken cancellationToken) =>
        {
            var link = await footerService.GetByIdAsync(id, cancellationToken);
            return link is null ? Results.NotFound() : Results.Ok(link);
        })
        .RequireAuthorization("AdminOnly");

        app.MapPost("/api/v1/admin/footer-links", async (
            CreateFooterLinkRequest request,
            FooterService footerService,
            CancellationToken cancellationToken) =>
        {
            var result = await footerService.CreateAsync(request, cancellationToken);
            return result.Ok ? Results.Ok(result.Link) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization("AdminOnly");

        app.MapPut("/api/v1/admin/footer-links/{id:guid}", async (
            Guid id,
            UpdateFooterLinkRequest request,
            FooterService footerService,
            CancellationToken cancellationToken) =>
        {
            var result = await footerService.UpdateAsync(id, request, cancellationToken);
            return result.Ok ? Results.Ok(result.Link) : (result.Error == "Footer-Link nicht gefunden." ? Results.NotFound(result.Error) : Results.BadRequest(result.Error));
        })
        .RequireAuthorization("AdminOnly");

        app.MapDelete("/api/v1/admin/footer-links/{id:guid}", async (
            Guid id,
            FooterService footerService,
            CancellationToken cancellationToken) =>
        {
            var result = await footerService.DeleteAsync(id, cancellationToken);
            return result.Ok ? Results.NoContent() : Results.NotFound(result.Error);
        })
        .RequireAuthorization("AdminOnly");

        return app;
    }
}
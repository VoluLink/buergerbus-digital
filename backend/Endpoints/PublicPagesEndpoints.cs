using BuergerbusAPI.Services;

namespace BuergerbusAPI.Endpoints;

public static class PublicPagesEndpoints
{
    public static IEndpointRouteBuilder MapPublicPagesEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/public/pages/{slug}", async (
            string slug,
            PageService pageService,
            CancellationToken cancellationToken) =>
        {
            var page = await pageService.GetPublishedBySlugAsync(slug, cancellationToken);
            return page is null ? Results.NotFound() : Results.Ok(page);
        });

        return app;
    }
}
using BuergerbusAPI.Services;

namespace BuergerbusAPI.Endpoints;

public static class PublicFooterEndpoints
{
    public static IEndpointRouteBuilder MapPublicFooterEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/public/footer", async (
            FooterService footerService,
            CancellationToken cancellationToken) =>
        {
            var footer = await footerService.GetPublicFooterAsync(cancellationToken);
            return Results.Ok(footer);
        });

        return app;
    }
}
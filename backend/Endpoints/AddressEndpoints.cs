using System.Net.Http.Json;

namespace BuergerbusAPI.Endpoints;

public static class AddressEndpoints
{
    private sealed record NominatimAddress(string Display_Name);
    private sealed record AddressSuggestion(string Label);

    public static IEndpointRouteBuilder MapAddressEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/adressen", async (string? q, IHttpClientFactory httpClientFactory, CancellationToken cancellationToken) =>
        {
            var query = q?.Trim();
            if (string.IsNullOrWhiteSpace(query) || query.Length < 3)
            {
                return Results.Ok(Array.Empty<AddressSuggestion>());
            }

            try
            {
                var client = httpClientFactory.CreateClient("Nominatim");
                var url = $"search?format=jsonv2&addressdetails=1&countrycodes=de&limit=5&q={Uri.EscapeDataString(query)}";
                var addresses = await client.GetFromJsonAsync<List<NominatimAddress>>(url, cancellationToken)
                    ?? [];

                return Results.Ok(addresses
                    .Select(address => new AddressSuggestion(address.Display_Name))
                    .DistinctBy(address => address.Label)
                    .ToList());
            }
            catch (HttpRequestException)
            {
                // Autocomplete is optional. The frontend deliberately keeps manual input enabled.
                return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
            }
        }).RequireAuthorization();

        return app;
    }
}

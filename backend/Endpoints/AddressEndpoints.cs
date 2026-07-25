using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BuergerbusAPI.Endpoints;

public static class AddressEndpoints
{
    private sealed record NominatimAddress(
        [property: JsonPropertyName("display_name")] string? DisplayName,
        [property: JsonPropertyName("lat")] string? Latitude,
        [property: JsonPropertyName("lon")] string? Longitude,
        [property: JsonPropertyName("address")] NominatimAddressDetails? Address);

    private sealed record NominatimAddressDetails(
        [property: JsonPropertyName("road")] string? Street,
        [property: JsonPropertyName("house_number")] string? HouseNumber,
        [property: JsonPropertyName("postcode")] string? PostalCode,
        [property: JsonPropertyName("city")] string? City,
        [property: JsonPropertyName("town")] string? Town,
        [property: JsonPropertyName("village")] string? Village);

    private sealed record AddressSuggestionDto(
        string DisplayName,
        string? Street,
        string? HouseNumber,
        string? PostalCode,
        string? City,
        double? Latitude,
        double? Longitude);

    public static IEndpointRouteBuilder MapAddressEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/adressen", async (
            string? q,
            HttpContext httpContext,
            IHttpClientFactory httpClientFactory,
            ILoggerFactory loggerFactory) =>
        {
            var query = q?.Trim() ?? string.Empty;
            if (query.Length < 3)
            {
                return Results.BadRequest(new { message = "Bitte mindestens drei Zeichen eingeben." });
            }

            if (query.Length > 150)
            {
                return Results.BadRequest(new { message = "Die Suchanfrage ist zu lang." });
            }

            var logger = loggerFactory.CreateLogger("AddressEndpoints");
            var stopwatch = Stopwatch.StartNew();
            var requestId = httpContext.TraceIdentifier;
            var requestUri = $"search?format=jsonv2&addressdetails=1&countrycodes=de&limit=5&q={Uri.EscapeDataString(query)}";
            using var externalTimeoutCts = CancellationTokenSource.CreateLinkedTokenSource(httpContext.RequestAborted);
            externalTimeoutCts.CancelAfter(TimeSpan.FromSeconds(10));

            try
            {
                var client = httpClientFactory.CreateClient("Nominatim");
                logger.LogInformation(
                    "Nominatim client configured. TimeoutMs={TimeoutMs} RequestId={RequestId}",
                    client.Timeout.TotalMilliseconds,
                    requestId);
                using var response = await client.GetAsync(
                    requestUri,
                    HttpCompletionOption.ResponseHeadersRead,
                    externalTimeoutCts.Token);

                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning(
                        "Nominatim returned status {StatusCode}. QueryLength={QueryLength} DurationMs={DurationMs} RequestId={RequestId}",
                        (int)response.StatusCode, query.Length, stopwatch.ElapsedMilliseconds, requestId);

                    return Results.Problem(
                        title: "Adresssuche nicht verfügbar",
                        detail: "Der externe Adressdienst konnte die Anfrage nicht verarbeiten. Die Adresse kann weiterhin manuell eingegeben werden.",
                        statusCode: StatusCodes.Status502BadGateway);
                }

                var addresses = await response.Content.ReadFromJsonAsync<List<NominatimAddress>>(cancellationToken: externalTimeoutCts.Token) ?? [];
                var suggestions = addresses
                    .Where(address => !string.IsNullOrWhiteSpace(address.DisplayName))
                    .Select(address => new AddressSuggestionDto(
                        address.DisplayName!,
                        address.Address?.Street,
                        address.Address?.HouseNumber,
                        address.Address?.PostalCode,
                        address.Address?.City ?? address.Address?.Town ?? address.Address?.Village,
                        double.TryParse(address.Latitude, System.Globalization.CultureInfo.InvariantCulture, out var latitude) ? latitude : null,
                        double.TryParse(address.Longitude, System.Globalization.CultureInfo.InvariantCulture, out var longitude) ? longitude : null))
                    .DistinctBy(address => address.DisplayName)
                    .ToList();

                return Results.Ok(suggestions);
            }
            catch (OperationCanceledException) when (httpContext.RequestAborted.IsCancellationRequested)
            {
                // The browser cancelled its request while typing; this is expected.
                return Results.StatusCode(499);
            }
            catch (OperationCanceledException) when (externalTimeoutCts.IsCancellationRequested)
            {
                logger.LogWarning(
                    "Nominatim request timed out. ClientTimeoutMs={ClientTimeoutMs} DurationMs={DurationMs} BrowserAborted={BrowserAborted} ExternalTimeoutTriggered={ExternalTimeoutTriggered} RequestId={RequestId}",
                    15_000,
                    stopwatch.ElapsedMilliseconds,
                    false,
                    true,
                    requestId);

                return Results.Problem(
                    title: "Adresssuche nicht erreichbar",
                    detail: "Der externe Adressdienst hat nicht rechtzeitig geantwortet. Die Adresse kann weiterhin manuell eingegeben werden.",
                    statusCode: StatusCodes.Status504GatewayTimeout);
            }
            catch (OperationCanceledException)
            {
                // SocketsHttpHandler.ConnectTimeout (5 seconds) cancelled the
                // connection attempt. This is a connectivity issue, not the
                // endpoint's 10-second external request timeout.
                logger.LogWarning(
                    "Nominatim connection attempt cancelled. ClientTimeoutMs={ClientTimeoutMs} DurationMs={DurationMs} BrowserAborted={BrowserAborted} ExternalTimeoutTriggered={ExternalTimeoutTriggered} RequestId={RequestId}",
                    15_000,
                    stopwatch.ElapsedMilliseconds,
                    false,
                    false,
                    requestId);

                return Results.Problem(
                    title: "Adresssuche nicht erreichbar",
                    detail: "Der externe Adressdienst ist momentan nicht erreichbar. Die Adresse kann weiterhin manuell eingegeben werden.",
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }
            catch (HttpRequestException exception)
            {
                logger.LogWarning(
                    exception,
                    "Nominatim network request failed. QueryLength={QueryLength} DurationMs={DurationMs} RequestId={RequestId}",
                    query.Length, stopwatch.ElapsedMilliseconds, requestId);

                return Results.Problem(
                    title: "Adresssuche nicht erreichbar",
                    detail: "Der externe Adressdienst ist momentan nicht erreichbar. Die Adresse kann weiterhin manuell eingegeben werden.",
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }
            catch (JsonException exception)
            {
                logger.LogWarning(
                    exception,
                    "Nominatim returned invalid JSON. QueryLength={QueryLength} DurationMs={DurationMs} RequestId={RequestId}",
                    query.Length, stopwatch.ElapsedMilliseconds, requestId);

                return Results.Problem(title: "Ungültige Antwort des Adressdienstes", statusCode: StatusCodes.Status502BadGateway);
            }
            catch (Exception exception)
            {
                logger.LogError(
                    exception,
                    "Unexpected Nominatim error. QueryLength={QueryLength} DurationMs={DurationMs} RequestId={RequestId}",
                    query.Length, stopwatch.ElapsedMilliseconds, requestId);

                return Results.Problem(title: "Adresssuche nicht verfügbar", statusCode: StatusCodes.Status502BadGateway);
            }
        }).RequireAuthorization();

        return app;
    }
}

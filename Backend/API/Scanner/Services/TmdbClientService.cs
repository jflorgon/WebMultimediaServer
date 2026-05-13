using System.Net.Http.Headers;
using API.Scanner.Models;
using Microsoft.Extensions.Options;

namespace API.Scanner.Services;

public sealed class TmdbClientService(HttpClient httpClient, IOptions<TmdbOptions> options, ILogger<TmdbClientService> logger)
    : ITmdbClientService
{
    private static readonly TimeSpan RequestDelay = TimeSpan.FromMilliseconds(250);

    public async Task<TmdbMovieResult?> SearchMovieAsync(string title, int? year, CancellationToken cancellationToken = default)
    {
        try
        {
            var yearParam = year.HasValue ? $"&year={year}" : string.Empty;
            var url = $"/3/search/movie?query={Uri.EscapeDataString(title)}{yearParam}&language=es-ES";
            var response = await httpClient.GetFromJsonAsync<TmdbSearchResponse<TmdbMovieResult>>(url, cancellationToken);
            await Task.Delay(RequestDelay, cancellationToken);
            return response?.Results.FirstOrDefault();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "TMDB movie search failed for '{Title}'", title);
            return null;
        }
    }

    public async Task<TmdbTvResult?> SearchTvAsync(string title, int? year = null, CancellationToken cancellationToken = default)
    {
        // Si la primera búsqueda con el título completo falla, vamos truncando
        // palabras finales — los nombres locales suelen llevar subtítulos en
        // español que TMDB no indexa (ej. "Cosmos La odisea..." → "Cosmos").
        var words = title.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var attempts = new List<string> { title };
        for (var n = words.Length - 1; n >= 1; n--)
            attempts.Add(string.Join(' ', words.Take(n)));

        foreach (var attempt in attempts.Distinct())
        {
            var result = await SearchTvOnceAsync(attempt, year, cancellationToken);
            if (result is not null)
            {
                if (!string.Equals(attempt, title, StringComparison.Ordinal))
                    logger.LogInformation("TMDB TV match con título truncado: '{Original}' → '{Trimmed}'", title, attempt);
                return result;
            }
        }
        return null;
    }

    private async Task<TmdbTvResult?> SearchTvOnceAsync(string title, int? year, CancellationToken cancellationToken)
    {
        try
        {
            var yearParam = year.HasValue ? $"&first_air_date_year={year}" : string.Empty;
            var url = $"/3/search/tv?query={Uri.EscapeDataString(title)}{yearParam}&language=es-ES";
            var response = await httpClient.GetFromJsonAsync<TmdbSearchResponse<TmdbTvResult>>(url, cancellationToken);
            await Task.Delay(RequestDelay, cancellationToken);
            return response?.Results.FirstOrDefault();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "TMDB TV search failed for '{Title}'", title);
            return null;
        }
    }

    public async Task<List<TmdbGenre>> GetMovieGenresAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<TmdbGenreResponse>("/3/genre/movie/list?language=es-ES", cancellationToken);
            return response?.Genres ?? [];
        }
        catch { return []; }
    }

    public async Task<List<TmdbGenre>> GetTvGenresAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<TmdbGenreResponse>("/3/genre/tv/list?language=es-ES", cancellationToken);
            return response?.Genres ?? [];
        }
        catch { return []; }
    }

    public async Task<TmdbSeason?> GetSeasonAsync(int seriesId, int seasonNumber, CancellationToken cancellationToken = default)
    {
        try
        {
            var url = $"/3/tv/{seriesId}/season/{seasonNumber}?language=es-ES";
            var response = await httpClient.GetFromJsonAsync<TmdbSeason>(url, cancellationToken);
            await Task.Delay(RequestDelay, cancellationToken);
            return response;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "TMDB season fetch failed for series {SeriesId}, season {Season}", seriesId, seasonNumber);
            return null;
        }
    }

    public async Task<string?> GetMovieCertificationAsync(int movieId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<TmdbMovieReleaseDatesResponse>(
                $"/3/movie/{movieId}/release_dates", cancellationToken);
            await Task.Delay(RequestDelay, cancellationToken);
            if (response is null) return null;

            // ES primero, US como fallback. Dentro de cada país, primera certificación no vacía.
            string? PickCertFromCountry(string code) =>
                response.Results
                    .FirstOrDefault(r => string.Equals(r.CountryCode, code, StringComparison.OrdinalIgnoreCase))
                    ?.ReleaseDates
                    .Select(d => d.Certification)
                    .FirstOrDefault(c => !string.IsNullOrWhiteSpace(c));

            return PickCertFromCountry("ES") ?? PickCertFromCountry("US");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "TMDB movie certification fetch failed for {MovieId}", movieId);
            return null;
        }
    }

    public async Task<string?> GetTvCertificationAsync(int tvId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<TmdbTvContentRatingsResponse>(
                $"/3/tv/{tvId}/content_ratings", cancellationToken);
            await Task.Delay(RequestDelay, cancellationToken);
            if (response is null) return null;

            string? PickCertFromCountry(string code) =>
                response.Results
                    .FirstOrDefault(r => string.Equals(r.CountryCode, code, StringComparison.OrdinalIgnoreCase))
                    ?.Rating;

            var es = PickCertFromCountry("ES");
            if (!string.IsNullOrWhiteSpace(es)) return es;
            var us = PickCertFromCountry("US");
            return string.IsNullOrWhiteSpace(us) ? null : us;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "TMDB tv certification fetch failed for {TvId}", tvId);
            return null;
        }
    }
}

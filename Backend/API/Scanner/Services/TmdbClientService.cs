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

    public async Task<TmdbTvResult?> SearchTvAsync(string title, CancellationToken cancellationToken = default)
    {
        try
        {
            var url = $"/3/search/tv?query={Uri.EscapeDataString(title)}&language=es-ES";
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
}

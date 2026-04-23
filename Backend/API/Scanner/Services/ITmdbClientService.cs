using API.Scanner.Models;

namespace API.Scanner.Services;

public interface ITmdbClientService
{
    Task<TmdbMovieResult?> SearchMovieAsync(string title, int? year, CancellationToken cancellationToken = default);
    Task<TmdbTvResult?> SearchTvAsync(string title, CancellationToken cancellationToken = default);
    Task<List<TmdbGenre>> GetMovieGenresAsync(CancellationToken cancellationToken = default);
    Task<List<TmdbGenre>> GetTvGenresAsync(CancellationToken cancellationToken = default);
    Task<TmdbSeason?> GetSeasonAsync(int seriesId, int seasonNumber, CancellationToken cancellationToken = default);
}

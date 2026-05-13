using API.Scanner.Models;

namespace API.Scanner.Services;

public interface ITmdbClientService
{
    Task<TmdbMovieResult?> SearchMovieAsync(string title, int? year, CancellationToken cancellationToken = default);
    Task<TmdbTvResult?> SearchTvAsync(string title, int? year = null, CancellationToken cancellationToken = default);
    Task<List<TmdbGenre>> GetMovieGenresAsync(CancellationToken cancellationToken = default);
    Task<List<TmdbGenre>> GetTvGenresAsync(CancellationToken cancellationToken = default);
    Task<TmdbSeason?> GetSeasonAsync(int seriesId, int seasonNumber, CancellationToken cancellationToken = default);

    /// <summary>Certificación por edad de una película. Intenta ES y cae a US si no hay.</summary>
    Task<string?> GetMovieCertificationAsync(int movieId, CancellationToken cancellationToken = default);

    /// <summary>Certificación por edad de una serie/doc-serie. Intenta ES y cae a US si no hay.</summary>
    Task<string?> GetTvCertificationAsync(int tvId, CancellationToken cancellationToken = default);
}

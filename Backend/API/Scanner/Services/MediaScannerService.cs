using System.Text.RegularExpressions;
using API.Scanner.Models;
using Application.Common.Interfaces;
using Application.Documentaries.Commands.UpsertDocumentary;
using Application.Movies.Commands.UpsertMovie;
using Application.Series.Commands.UpsertEpisode;
using Application.Series.Commands.UpsertSeries;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace API.Scanner.Services;

public sealed partial class MediaScannerService(
    IMediator mediator,
    ITmdbClientService tmdbClient,
    IOptions<ScannerOptions> options,
    ILogger<MediaScannerService> logger,
    IApplicationDbContext db) : IMediaScannerService
{
    private static readonly HashSet<string> SeriesFolderKeywords = new(StringComparer.OrdinalIgnoreCase)
        { "series", "serie", "shows", "tv", "television" };

    private static readonly HashSet<string> DocumentaryFolderKeywords = new(StringComparer.OrdinalIgnoreCase)
        { "documentaries", "documentales", "documentary", "documental" };

    public async Task<int> ScanAsync(CancellationToken cancellationToken = default)
    {
        var movieGenres = await tmdbClient.GetMovieGenresAsync(cancellationToken);
        var tvGenres = await tmdbClient.GetTvGenresAsync(cancellationToken);

        var foundMovies = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var foundDocumentaries = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var foundSeries = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var foundEpisodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        int count = 0;
        foreach (var mediaPath in options.Value.MediaPaths)
        {
            if (!Directory.Exists(mediaPath))
            {
                logger.LogWarning("La carpeta no existe o no es accesible: {Path}", mediaPath);
                continue;
            }

            logger.LogInformation("Iniciando escaneo de carpeta: {Path}", mediaPath);

            var mediaPathName = Path.GetFileName(mediaPath.TrimEnd(Path.DirectorySeparatorChar, '/'));

            if (SeriesFolderKeywords.Contains(mediaPathName))
            {
                count += await ProcessSeriesRootAsync(
                    mediaPath, tvGenres, foundSeries, foundEpisodes, cancellationToken);
            }
            else
            {
                var files = Directory.EnumerateFiles(mediaPath, "*", SearchOption.AllDirectories)
                    .Where(f => options.Value.VideoExtensions.Contains(
                        Path.GetExtension(f).ToLowerInvariant()))
                    .ToList();

                logger.LogInformation("{Count} ficheros de vídeo encontrados en {Path}", files.Count, mediaPath);

                int pathCount = 0;
                foreach (var file in files)
                {
                    if (cancellationToken.IsCancellationRequested) break;
                    try
                    {
                        var fileType = await ProcessFileAsync(
                            file, mediaPathName, movieGenres, cancellationToken);
                        if (fileType == "movie") foundMovies.Add(file);
                        else if (fileType == "documentary") foundDocumentaries.Add(file);
                        count++;
                        pathCount++;
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Error procesando fichero: {File}", file);
                    }
                }

                logger.LogInformation("Escaneo completado para {Path}: {Processed}/{Total} ficheros procesados",
                    mediaPath, pathCount, files.Count);
            }
        }

        await CleanupMissingItemsAsync(foundMovies, foundDocumentaries, foundSeries, foundEpisodes, cancellationToken);

        return count;
    }

    private async Task<int> ProcessSeriesRootAsync(
        string seriesRoot,
        List<TmdbGenre> tvGenres,
        HashSet<string> foundSeries,
        HashSet<string> foundEpisodes,
        CancellationToken cancellationToken)
    {
        int count = 0;
        var seriesFolders = Directory.EnumerateDirectories(seriesRoot).ToList();
        logger.LogInformation("{Count} posibles series encontradas en {Path}", seriesFolders.Count, seriesRoot);

        foreach (var seriesFolder in seriesFolders)
        {
            if (cancellationToken.IsCancellationRequested) break;
            try
            {
                count += await ProcessSeriesFolderAsync(
                    seriesFolder, tvGenres, foundSeries, foundEpisodes, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error procesando carpeta de serie: {Folder}", seriesFolder);
            }
        }

        return count;
    }

    private async Task<int> ProcessSeriesFolderAsync(
        string seriesFolder,
        List<TmdbGenre> tvGenres,
        HashSet<string> foundSeries,
        HashSet<string> foundEpisodes,
        CancellationToken cancellationToken)
    {
        var seriesFolderName = Path.GetFileName(seriesFolder);
        var (cleanTitle, _) = ParseFileName(seriesFolderName);

        logger.LogDebug("Procesando serie: '{Title}' en {Folder}", cleanTitle, seriesFolder);

        var result = await tmdbClient.SearchTvAsync(cleanTitle, cancellationToken);

        if (result is not null)
            logger.LogInformation("Serie encontrada: '{Name}' → TMDB: {Title} (ID: {Id})",
                cleanTitle, result.Name, result.Id);
        else
            logger.LogWarning("Sin coincidencia en TMDB para serie: '{Title}'", cleanTitle);

        var genres = result?.GenreIds
            .Select(id => tvGenres.FirstOrDefault(g => g.Id == id)?.Name ?? string.Empty)
            .Where(n => !string.IsNullOrEmpty(n)).ToList() ?? [];

        var seriesId = await mediator.Send(new UpsertSeriesCommand(
            FilePath: seriesFolder,
            Title: result?.Name ?? cleanTitle,
            OriginalTitle: result?.OriginalName,
            Year: ParseYear(result?.FirstAirDate),
            PosterUrl: result?.PosterPath is not null ? $"https://image.tmdb.org/t/p/w500{result.PosterPath}" : null,
            BackdropUrl: result?.BackdropPath is not null ? $"https://image.tmdb.org/t/p/w1280{result.BackdropPath}" : null,
            Overview: result?.Overview,
            Genres: genres,
            Rating: result?.VoteAverage > 0 ? result.VoteAverage : null,
            Seasons: result?.NumberOfSeasons ?? 1,
            Episodes: result?.NumberOfEpisodes ?? 1,
            TmdbId: result?.Id
        ), cancellationToken);

        foundSeries.Add(seriesFolder);
        int episodeCount = 0;

        var seasonFolders = Directory.EnumerateDirectories(seriesFolder).ToList();
        foreach (var seasonFolder in seasonFolders)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var seasonFolderName = Path.GetFileName(seasonFolder);
            var seasonNumber = EpisodeParser.ParseSeasonFolder(seasonFolderName);

            if (seasonNumber is null)
            {
                logger.LogDebug("Carpeta '{Folder}' no reconocida como temporada, omitiendo", seasonFolderName);
                continue;
            }

            var episodeFiles = Directory.EnumerateFiles(seasonFolder)
                .Where(f => options.Value.VideoExtensions.Contains(
                    Path.GetExtension(f).ToLowerInvariant()))
                .ToList();

            foreach (var episodeFile in episodeFiles)
            {
                if (cancellationToken.IsCancellationRequested) break;
                try
                {
                    var parsed = EpisodeParser.ParseEpisodeNumbers(episodeFile);
                    if (parsed is null)
                    {
                        logger.LogDebug("No se pudo parsear número de episodio: {File}", Path.GetFileName(episodeFile));
                        continue;
                    }

                    var (parsedSeason, episodeNumber) = parsed.Value;
                    var actualSeason = parsedSeason > 0 ? parsedSeason : seasonNumber.Value;
                    var episodeTitle = EpisodeParser.ExtractEpisodeTitle(episodeFile);

                    await mediator.Send(new UpsertEpisodeCommand(
                        SeriesId: seriesId,
                        SeasonNumber: actualSeason,
                        EpisodeNumber: episodeNumber,
                        Title: episodeTitle,
                        FilePath: episodeFile,
                        TmdbId: null
                    ), cancellationToken);

                    foundEpisodes.Add(episodeFile);
                    episodeCount++;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error procesando episodio: {File}", episodeFile);
                }
            }

            logger.LogInformation("Temporada {Season} de '{Series}': {Count} episodios procesados",
                seasonNumber, cleanTitle, episodeFiles.Count);
        }

        return episodeCount;
    }

    private async Task<string> ProcessFileAsync(
        string filePath,
        string mediaPathName,
        List<TmdbGenre> movieGenres,
        CancellationToken cancellationToken)
    {
        var fileName = Path.GetFileNameWithoutExtension(filePath);
        var (cleanTitle, year) = ParseFileName(fileName);

        logger.LogDebug("Fichero encontrado: {File} | Título parseado: {Title} ({Year})",
            Path.GetFileName(filePath), cleanTitle, year);

        if (DocumentaryFolderKeywords.Contains(mediaPathName))
        {
            logger.LogDebug("Tipo detectado: Documental | Buscando en TMDB: '{Title}'", cleanTitle);
            var result = await tmdbClient.SearchMovieAsync(cleanTitle, year, cancellationToken);

            if (result is not null)
                logger.LogInformation("Documental encontrado: {File} → TMDB: {Title} (ID: {Id})",
                    Path.GetFileName(filePath), result.Title, result.Id);
            else
                logger.LogWarning("Sin coincidencia en TMDB para documental: '{Title}' ({File})",
                    cleanTitle, Path.GetFileName(filePath));

            var genres = result?.GenreIds
                .Select(id => movieGenres.FirstOrDefault(g => g.Id == id)?.Name ?? string.Empty)
                .Where(n => !string.IsNullOrEmpty(n)).ToList() ?? [];

            await mediator.Send(new UpsertDocumentaryCommand(
                FilePath: filePath,
                Title: result?.Title ?? cleanTitle,
                OriginalTitle: result?.OriginalTitle,
                Year: ParseYear(result?.ReleaseDate) ?? year,
                PosterUrl: result?.PosterPath is not null ? $"https://image.tmdb.org/t/p/w500{result.PosterPath}" : null,
                BackdropUrl: result?.BackdropPath is not null ? $"https://image.tmdb.org/t/p/w1280{result.BackdropPath}" : null,
                Overview: result?.Overview,
                Genres: genres,
                Rating: result?.VoteAverage > 0 ? result.VoteAverage : null,
                RuntimeMinutes: result?.Runtime,
                TmdbId: result?.Id
            ), cancellationToken);

            return "documentary";
        }
        else
        {
            logger.LogDebug("Tipo detectado: Película | Buscando en TMDB: '{Title}'", cleanTitle);
            var result = await tmdbClient.SearchMovieAsync(cleanTitle, year, cancellationToken);

            if (result is not null)
                logger.LogInformation("Película encontrada: {File} → TMDB: {Title} (ID: {Id})",
                    Path.GetFileName(filePath), result.Title, result.Id);
            else
                logger.LogWarning("Sin coincidencia en TMDB para película: '{Title}' ({File})",
                    cleanTitle, Path.GetFileName(filePath));

            var genres = result?.GenreIds
                .Select(id => movieGenres.FirstOrDefault(g => g.Id == id)?.Name ?? string.Empty)
                .Where(n => !string.IsNullOrEmpty(n)).ToList() ?? [];

            await mediator.Send(new UpsertMovieCommand(
                FilePath: filePath,
                Title: result?.Title ?? cleanTitle,
                OriginalTitle: result?.OriginalTitle,
                Year: ParseYear(result?.ReleaseDate) ?? year,
                PosterUrl: result?.PosterPath is not null ? $"https://image.tmdb.org/t/p/w500{result.PosterPath}" : null,
                BackdropUrl: result?.BackdropPath is not null ? $"https://image.tmdb.org/t/p/w1280{result.BackdropPath}" : null,
                Overview: result?.Overview,
                Genres: genres,
                Rating: result?.VoteAverage > 0 ? result.VoteAverage : null,
                RuntimeMinutes: result?.Runtime,
                TmdbId: result?.Id
            ), cancellationToken);

            return "movie";
        }
    }

    private async Task CleanupMissingItemsAsync(
        HashSet<string> foundMovies,
        HashSet<string> foundDocumentaries,
        HashSet<string> foundSeries,
        HashSet<string> foundEpisodes,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Iniciando limpieza de elementos eliminados del disco...");

        var moviesToDelete = await db.Movies
            .Where(m => !foundMovies.Contains(m.FilePath))
            .ToListAsync(cancellationToken);
        if (moviesToDelete.Count > 0)
        {
            foreach (var m in moviesToDelete)
                db.Movies.Remove(m);
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Se eliminaron {Count} películas de la BD", moviesToDelete.Count);
        }

        var documentsToDelete = await db.Documentaries
            .Where(d => !foundDocumentaries.Contains(d.FilePath))
            .ToListAsync(cancellationToken);
        if (documentsToDelete.Count > 0)
        {
            foreach (var d in documentsToDelete)
                db.Documentaries.Remove(d);
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Se eliminaron {Count} documentales de la BD", documentsToDelete.Count);
        }

        var seriesToDelete = await db.Series
            .Where(s => !foundSeries.Contains(s.FilePath))
            .ToListAsync(cancellationToken);
        if (seriesToDelete.Count > 0)
        {
            foreach (var s in seriesToDelete)
                db.Series.Remove(s);
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Se eliminaron {Count} series de la BD (y sus episodios)", seriesToDelete.Count);
        }

        var episodesToDelete = await db.Episodes
            .Where(e => !foundEpisodes.Contains(e.FilePath))
            .ToListAsync(cancellationToken);
        if (episodesToDelete.Count > 0)
        {
            foreach (var e in episodesToDelete)
                db.Episodes.Remove(e);
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Se eliminaron {Count} episodios de la BD", episodesToDelete.Count);
        }
    }

    private static (string Title, int? Year) ParseFileName(string fileName)
    {
        var yearMatch = YearRegex().Match(fileName);
        int? year = null;
        if (yearMatch.Success && int.TryParse(yearMatch.Value.Trim('.', '(', ')'), out var y))
            year = y;

        var title = YearRegex().Replace(fileName, string.Empty);
        title = CleanupRegex().Replace(title, " ").Trim();
        return (title, year);
    }

    private static int? ParseYear(string? dateString)
    {
        if (string.IsNullOrEmpty(dateString) || dateString.Length < 4) return null;
        return int.TryParse(dateString[..4], out var y) ? y : null;
    }

    [GeneratedRegex(@"[\.\s\(\[]\d{4}[\)\]]?")]
    private static partial Regex YearRegex();

    [GeneratedRegex(@"[\.\-_]+")]
    private static partial Regex CleanupRegex();
}

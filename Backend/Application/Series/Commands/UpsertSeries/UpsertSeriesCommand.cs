using MediatR;

namespace Application.Series.Commands.UpsertSeries;

public sealed record UpsertSeriesCommand(
    string FilePath,
    string Title,
    string? OriginalTitle,
    int? Year,
    string? PosterUrl,
    string? BackdropUrl,
    string? Overview,
    List<string> Genres,
    double? Rating,
    int Seasons,
    int Episodes,
    int? TmdbId) : IRequest<Guid>;

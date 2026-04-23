using MediatR;

namespace Application.Movies.Commands.UpsertMovie;

public sealed record UpsertMovieCommand(
    string FilePath,
    string Title,
    string? OriginalTitle,
    int? Year,
    string? PosterUrl,
    string? BackdropUrl,
    string? Overview,
    List<string> Genres,
    double? Rating,
    int? RuntimeMinutes,
    int? TmdbId) : IRequest<Guid>;

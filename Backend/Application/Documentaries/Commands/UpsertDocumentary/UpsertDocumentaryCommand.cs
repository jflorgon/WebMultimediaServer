using MediatR;

namespace Application.Documentaries.Commands.UpsertDocumentary;

public sealed record UpsertDocumentaryCommand(
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

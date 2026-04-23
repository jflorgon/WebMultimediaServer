using MediatR;

namespace Application.Series.Commands.UpsertEpisode;

public sealed record UpsertEpisodeCommand(
    Guid SeriesId,
    int SeasonNumber,
    int EpisodeNumber,
    string Title,
    string FilePath,
    int? TmdbId) : IRequest<Guid>;

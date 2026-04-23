using Contracts.Series;
using MediatR;

namespace Application.Series.Queries.GetEpisodesBySeries;

public sealed record GetEpisodesBySeriesQuery(Guid SeriesId) : IRequest<IReadOnlyList<EpisodeListItemDto>>;

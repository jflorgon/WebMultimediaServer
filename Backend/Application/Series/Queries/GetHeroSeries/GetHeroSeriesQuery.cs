using Contracts.Series;
using MediatR;

namespace Application.Series.Queries.GetHeroSeries;

public sealed record GetHeroSeriesQuery(int Count, double MinRating)
    : IRequest<IReadOnlyList<SeriesListItemDto>>;

using Contracts.Series;
using MediatR;

namespace Application.Series.Queries.GetSeriesById;

public sealed record GetSeriesByIdQuery(Guid Id) : IRequest<SeriesDto?>;

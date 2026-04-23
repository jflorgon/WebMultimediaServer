using Contracts.Series;
using Core.Pagination;
using MediatR;

namespace Application.Series.Queries.GetSeries;

public sealed record GetSeriesQuery(
    string? Title,
    string? Genre,
    int? Year,
    int Page = 1,
    int PageSize = 20) : IRequest<PagedResult<SeriesListItemDto>>;

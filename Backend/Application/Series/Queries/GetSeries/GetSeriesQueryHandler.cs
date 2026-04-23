using Application.Common.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Contracts.Series;
using Core.Pagination;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Series.Queries.GetSeries;

public sealed class GetSeriesQueryHandler(IApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetSeriesQuery, PagedResult<SeriesListItemDto>>
{
    public async Task<PagedResult<SeriesListItemDto>> Handle(GetSeriesQuery request, CancellationToken cancellationToken)
    {
        var query = db.Series.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Title))
            query = query.Where(s => s.Title.ToLower().Contains(request.Title.ToLower()));

        if (request.Year.HasValue)
            query = query.Where(s => s.Year == request.Year);

        if (!string.IsNullOrWhiteSpace(request.Genre))
            query = query.Where(s => s.Genres.Contains(request.Genre));

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<SeriesListItemDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return new PagedResult<SeriesListItemDto>(items, totalCount, request.Page, request.PageSize);
    }
}

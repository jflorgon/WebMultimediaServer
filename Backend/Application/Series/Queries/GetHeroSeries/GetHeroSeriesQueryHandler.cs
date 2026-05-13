using Application.Common.Interfaces;
using AutoMapper;
using Contracts.Series;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SeriesEntity = Domain.Entities.Series;

namespace Application.Series.Queries.GetHeroSeries;

public sealed class GetHeroSeriesQueryHandler(IApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetHeroSeriesQuery, IReadOnlyList<SeriesListItemDto>>
{
    public async Task<IReadOnlyList<SeriesListItemDto>> Handle(GetHeroSeriesQuery request, CancellationToken cancellationToken)
    {
        // Las series con Kind=Documentary se listan como documentales; aquí sólo series puras.
        var baseQuery = db.Series.AsNoTracking().Where(s => s.Kind == SeriesKind.Series);

        var primary = await PickRandomAsync(
            baseQuery.Where(s => s.Rating != null && s.Rating >= request.MinRating),
            request.Count,
            cancellationToken);

        if (primary.Count < request.Count)
        {
            var needed = request.Count - primary.Count;
            var pickedIds = primary.Select(p => p.Id).ToList();
            var fallback = await PickRandomAsync(
                baseQuery.Where(s => !pickedIds.Contains(s.Id)),
                needed,
                cancellationToken);
            primary.AddRange(fallback);
        }

        return mapper.Map<List<SeriesListItemDto>>(primary);
    }

    private static Task<List<SeriesEntity>> PickRandomAsync(IQueryable<SeriesEntity> query, int count, CancellationToken ct) =>
        query.OrderBy(_ => Guid.NewGuid()).Take(count).ToListAsync(ct);
}

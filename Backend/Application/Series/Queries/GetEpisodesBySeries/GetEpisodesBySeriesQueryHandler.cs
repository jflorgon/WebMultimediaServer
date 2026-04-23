using Application.Common.Interfaces;
using AutoMapper;
using Contracts.Series;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Series.Queries.GetEpisodesBySeries;

public sealed class GetEpisodesBySeriesQueryHandler(IApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetEpisodesBySeriesQuery, IReadOnlyList<EpisodeListItemDto>>
{
    public async Task<IReadOnlyList<EpisodeListItemDto>> Handle(
        GetEpisodesBySeriesQuery request,
        CancellationToken cancellationToken)
    {
        var episodes = await db.Episodes
            .AsNoTracking()
            .Where(e => e.SeriesId == request.SeriesId)
            .OrderBy(e => e.SeasonNumber)
            .ThenBy(e => e.EpisodeNumber)
            .ToListAsync(cancellationToken);

        return mapper.Map<IReadOnlyList<EpisodeListItemDto>>(episodes);
    }
}

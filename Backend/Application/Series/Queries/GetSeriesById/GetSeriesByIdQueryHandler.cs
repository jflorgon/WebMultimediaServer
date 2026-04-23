using Application.Common.Interfaces;
using AutoMapper;
using Contracts.Series;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Series.Queries.GetSeriesById;

public sealed class GetSeriesByIdQueryHandler(IApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetSeriesByIdQuery, SeriesDto?>
{
    public async Task<SeriesDto?> Handle(GetSeriesByIdQuery request, CancellationToken cancellationToken)
    {
        var series = await db.Series
            .AsNoTracking()
            .Include(s => s.EpisodeFiles)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        return series is null ? null : mapper.Map<SeriesDto>(series);
    }
}

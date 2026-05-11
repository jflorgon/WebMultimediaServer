using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Series.Queries.GetSeriesGenres;

public sealed class GetSeriesGenresQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetSeriesGenresQuery, IReadOnlyList<string>>
{
    public async Task<IReadOnlyList<string>> Handle(GetSeriesGenresQuery request, CancellationToken cancellationToken)
    {
        return await db.Series.AsNoTracking()
            .SelectMany(s => s.Genres)
            .Distinct()
            .OrderBy(g => g)
            .ToListAsync(cancellationToken);
    }
}

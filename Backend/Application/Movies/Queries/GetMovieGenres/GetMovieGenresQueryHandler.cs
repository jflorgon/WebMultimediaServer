using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Movies.Queries.GetMovieGenres;

public sealed class GetMovieGenresQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetMovieGenresQuery, IReadOnlyList<string>>
{
    public async Task<IReadOnlyList<string>> Handle(GetMovieGenresQuery request, CancellationToken cancellationToken)
    {
        return await db.Movies.AsNoTracking()
            .SelectMany(m => m.Genres)
            .Distinct()
            .OrderBy(g => g)
            .ToListAsync(cancellationToken);
    }
}

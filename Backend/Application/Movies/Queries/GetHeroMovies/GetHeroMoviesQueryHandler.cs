using Application.Common.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Contracts.Movies;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Movies.Queries.GetHeroMovies;

public sealed class GetHeroMoviesQueryHandler(IApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetHeroMoviesQuery, IReadOnlyList<MovieListItemDto>>
{
    public async Task<IReadOnlyList<MovieListItemDto>> Handle(GetHeroMoviesQuery request, CancellationToken cancellationToken)
    {
        var primary = await PickRandomAsync(
            db.Movies.AsNoTracking().Where(m => m.Rating != null && m.Rating >= request.MinRating),
            request.Count,
            cancellationToken);

        if (primary.Count < request.Count)
        {
            var needed = request.Count - primary.Count;
            var pickedIds = primary.Select(p => p.Id).ToList();
            var fallback = await PickRandomAsync(
                db.Movies.AsNoTracking().Where(m => !pickedIds.Contains(m.Id)),
                needed,
                cancellationToken);
            primary.AddRange(fallback);
        }

        return mapper.Map<List<MovieListItemDto>>(primary);
    }

    private static Task<List<Movie>> PickRandomAsync(IQueryable<Movie> query, int count, CancellationToken ct) =>
        // OrderBy(Guid.NewGuid()) → SQL Server lo traduce a ORDER BY NEWID(): aleatorio por fila.
        query.OrderBy(_ => Guid.NewGuid()).Take(count).ToListAsync(ct);
}

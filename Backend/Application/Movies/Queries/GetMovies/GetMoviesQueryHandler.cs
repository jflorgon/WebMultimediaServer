using Application.Common.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Contracts.Movies;
using Core.Pagination;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Movies.Queries.GetMovies;

public sealed class GetMoviesQueryHandler(IApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetMoviesQuery, PagedResult<MovieListItemDto>>
{
    public async Task<PagedResult<MovieListItemDto>> Handle(GetMoviesQuery request, CancellationToken cancellationToken)
    {
        var query = db.Movies.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Title))
            query = query.Where(m => m.Title.ToLower().Contains(request.Title.ToLower()));

        if (request.Year.HasValue)
            query = query.Where(m => m.Year == request.Year);

        if (!string.IsNullOrWhiteSpace(request.Genre))
            query = query.Where(m => m.Genres.Contains(request.Genre));

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<MovieListItemDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return new PagedResult<MovieListItemDto>(items, totalCount, request.Page, request.PageSize);
    }
}

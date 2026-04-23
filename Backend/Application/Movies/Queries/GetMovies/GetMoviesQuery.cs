using Contracts.Movies;
using Core.Pagination;
using MediatR;

namespace Application.Movies.Queries.GetMovies;

public sealed record GetMoviesQuery(
    string? Title,
    string? Genre,
    int? Year,
    int Page = 1,
    int PageSize = 20) : IRequest<PagedResult<MovieListItemDto>>;

using Contracts.Movies;
using MediatR;

namespace Application.Movies.Queries.GetHeroMovies;

public sealed record GetHeroMoviesQuery(int Count, double MinRating)
    : IRequest<IReadOnlyList<MovieListItemDto>>;

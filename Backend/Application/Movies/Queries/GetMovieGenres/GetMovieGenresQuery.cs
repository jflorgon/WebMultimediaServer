using MediatR;

namespace Application.Movies.Queries.GetMovieGenres;

public sealed record GetMovieGenresQuery() : IRequest<IReadOnlyList<string>>;

using Contracts.Movies;
using MediatR;

namespace Application.Movies.Queries.GetMovieById;

public sealed record GetMovieByIdQuery(Guid Id) : IRequest<MovieDto?>;

using Application.Common.Interfaces;
using AutoMapper;
using Contracts.Movies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Movies.Queries.GetMovieById;

public sealed class GetMovieByIdQueryHandler(IApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetMovieByIdQuery, MovieDto?>
{
    public async Task<MovieDto?> Handle(GetMovieByIdQuery request, CancellationToken cancellationToken)
    {
        var movie = await db.Movies
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);

        return movie is null ? null : mapper.Map<MovieDto>(movie);
    }
}

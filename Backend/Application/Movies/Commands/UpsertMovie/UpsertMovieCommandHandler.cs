using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Movies.Commands.UpsertMovie;

public sealed class UpsertMovieCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpsertMovieCommand, Guid>
{
    public async Task<Guid> Handle(UpsertMovieCommand request, CancellationToken cancellationToken)
    {
        const int DaysBeforeRefresh = 180;
        var existing = await db.Movies
            .FirstOrDefaultAsync(m => m.FilePath == request.FilePath, cancellationToken);

        if (existing is null)
        {
            var movie = new Movie
            {
                Id = Guid.NewGuid(),
                FilePath = request.FilePath,
                Title = request.Title,
                OriginalTitle = request.OriginalTitle,
                Year = request.Year,
                PosterUrl = request.PosterUrl,
                BackdropUrl = request.BackdropUrl,
                Overview = request.Overview,
                Genres = request.Genres,
                Rating = request.Rating,
                RuntimeMinutes = request.RuntimeMinutes,
                TmdbId = request.TmdbId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.Movies.Add(movie);
            await db.SaveChangesAsync(cancellationToken);
            return movie.Id;
        }

        var shouldRefresh = (DateTime.UtcNow - existing.UpdatedAt).TotalDays >= DaysBeforeRefresh;
        if (shouldRefresh)
        {
            existing.Title = request.Title;
            existing.OriginalTitle = request.OriginalTitle;
            existing.Year = request.Year;
            existing.PosterUrl = request.PosterUrl;
            existing.BackdropUrl = request.BackdropUrl;
            existing.Overview = request.Overview;
            existing.Genres = request.Genres;
            existing.Rating = request.Rating;
            existing.RuntimeMinutes = request.RuntimeMinutes;
            existing.TmdbId = request.TmdbId;
            existing.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        return existing.Id;
    }
}

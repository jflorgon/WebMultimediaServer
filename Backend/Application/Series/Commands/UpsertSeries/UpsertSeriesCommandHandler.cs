using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SeriesEntity = Domain.Entities.Series;

namespace Application.Series.Commands.UpsertSeries;

public sealed class UpsertSeriesCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpsertSeriesCommand, Guid>
{
    public async Task<Guid> Handle(UpsertSeriesCommand request, CancellationToken cancellationToken)
    {
        const int DaysBeforeRefresh = 180;
        var existing = await db.Series
            .FirstOrDefaultAsync(s => s.FilePath == request.FilePath, cancellationToken);

        if (existing is null)
        {
            var series = new SeriesEntity
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
                Seasons = request.Seasons,
                Episodes = request.Episodes,
                TmdbId = request.TmdbId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.Series.Add(series);
            await db.SaveChangesAsync(cancellationToken);
            return series.Id;
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
            existing.Seasons = request.Seasons;
            existing.Episodes = request.Episodes;
            existing.TmdbId = request.TmdbId;
            existing.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        return existing.Id;
    }
}

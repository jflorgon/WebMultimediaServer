using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using EpisodeEntity = Domain.Entities.Episode;

namespace Application.Series.Commands.UpsertEpisode;

public sealed class UpsertEpisodeCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpsertEpisodeCommand, Guid>
{
    public async Task<Guid> Handle(UpsertEpisodeCommand request, CancellationToken cancellationToken)
    {
        const int DaysBeforeRefresh = 180;
        var existing = await db.Episodes
            .FirstOrDefaultAsync(e => e.FilePath == request.FilePath, cancellationToken);

        if (existing is null)
        {
            var episode = new EpisodeEntity
            {
                Id = Guid.NewGuid(),
                SeriesId = request.SeriesId,
                SeasonNumber = request.SeasonNumber,
                EpisodeNumber = request.EpisodeNumber,
                Title = request.Title,
                FilePath = request.FilePath,
                TmdbId = request.TmdbId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.Episodes.Add(episode);
            await db.SaveChangesAsync(cancellationToken);
            return episode.Id;
        }

        var shouldRefresh = (DateTime.UtcNow - existing.UpdatedAt).TotalDays >= DaysBeforeRefresh;
        if (shouldRefresh)
        {
            existing.SeasonNumber = request.SeasonNumber;
            existing.EpisodeNumber = request.EpisodeNumber;
            existing.Title = request.Title;
            existing.TmdbId = request.TmdbId;
            existing.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        return existing.Id;
    }
}

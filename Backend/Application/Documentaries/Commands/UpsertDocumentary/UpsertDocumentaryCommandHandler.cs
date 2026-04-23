using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Documentaries.Commands.UpsertDocumentary;

public sealed class UpsertDocumentaryCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpsertDocumentaryCommand, Guid>
{
    public async Task<Guid> Handle(UpsertDocumentaryCommand request, CancellationToken cancellationToken)
    {
        const int DaysBeforeRefresh = 180;
        var existing = await db.Documentaries
            .FirstOrDefaultAsync(d => d.FilePath == request.FilePath, cancellationToken);

        if (existing is null)
        {
            var doc = new Documentary
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
            db.Documentaries.Add(doc);
            await db.SaveChangesAsync(cancellationToken);
            return doc.Id;
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

using Microsoft.EntityFrameworkCore;
using SeriesEntity = Domain.Entities.Series;
using MovieEntity = Domain.Entities.Movie;
using DocumentaryEntity = Domain.Entities.Documentary;
using EpisodeEntity = Domain.Entities.Episode;

namespace Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<MovieEntity> Movies { get; }
    DbSet<SeriesEntity> Series { get; }
    DbSet<DocumentaryEntity> Documentaries { get; }
    DbSet<EpisodeEntity> Episodes { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

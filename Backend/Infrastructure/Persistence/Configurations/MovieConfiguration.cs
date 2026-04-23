using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class MovieConfiguration : IEntityTypeConfiguration<Movie>
{
    public void Configure(EntityTypeBuilder<Movie> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Title).HasMaxLength(500).IsRequired();
        builder.Property(m => m.OriginalTitle).HasMaxLength(500);
        builder.Property(m => m.FilePath).HasMaxLength(1000).IsRequired();
        builder.Property(m => m.PosterUrl).HasMaxLength(500);
        builder.Property(m => m.BackdropUrl).HasMaxLength(500);
        builder.HasIndex(m => m.FilePath).IsUnique();
        builder.HasIndex(m => m.TmdbId);
        builder.PrimitiveCollection(m => m.Genres).HasColumnType("nvarchar(max)");
    }
}

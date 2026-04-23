using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class SeriesConfiguration : IEntityTypeConfiguration<Series>
{
    public void Configure(EntityTypeBuilder<Series> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Title).HasMaxLength(500).IsRequired();
        builder.Property(s => s.OriginalTitle).HasMaxLength(500);
        builder.Property(s => s.FilePath).HasMaxLength(1000).IsRequired();
        builder.Property(s => s.PosterUrl).HasMaxLength(500);
        builder.Property(s => s.BackdropUrl).HasMaxLength(500);
        builder.HasIndex(s => s.FilePath).IsUnique();
        builder.HasIndex(s => s.TmdbId);
        builder.PrimitiveCollection(s => s.Genres).HasColumnType("nvarchar(max)");
    }
}

using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class DocumentaryConfiguration : IEntityTypeConfiguration<Documentary>
{
    public void Configure(EntityTypeBuilder<Documentary> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Title).HasMaxLength(500).IsRequired();
        builder.Property(d => d.OriginalTitle).HasMaxLength(500);
        builder.Property(d => d.FilePath).HasMaxLength(1000).IsRequired();
        builder.Property(d => d.PosterUrl).HasMaxLength(500);
        builder.Property(d => d.BackdropUrl).HasMaxLength(500);
        builder.HasIndex(d => d.FilePath).IsUnique();
        builder.HasIndex(d => d.TmdbId);
        builder.PrimitiveCollection(d => d.Genres).HasColumnType("nvarchar(max)");
    }
}

using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class EpisodeConfiguration : IEntityTypeConfiguration<Episode>
{
    public void Configure(EntityTypeBuilder<Episode> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Title).HasMaxLength(500).IsRequired();
        builder.Property(e => e.FilePath).HasMaxLength(1000).IsRequired();

        builder.HasIndex(e => e.FilePath).IsUnique();
        builder.HasIndex(e => new { e.SeriesId, e.SeasonNumber, e.EpisodeNumber });

        builder.HasOne(e => e.Series)
            .WithMany(s => s.EpisodeFiles)
            .HasForeignKey(e => e.SeriesId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

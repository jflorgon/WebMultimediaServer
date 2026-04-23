namespace Domain.Entities;

public sealed class Episode
{
    public Guid Id { get; set; }
    public Guid SeriesId { get; set; }
    public int SeasonNumber { get; set; }
    public int EpisodeNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public int? TmdbId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Series Series { get; set; } = null!;
}

namespace Contracts.Documentaries;

public sealed record DocumentaryDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? OriginalTitle { get; init; }
    public int? Year { get; init; }
    public string FilePath { get; init; } = string.Empty;
    public string? PosterUrl { get; init; }
    public string? BackdropUrl { get; init; }
    public string? Overview { get; init; }
    public List<string> Genres { get; init; } = [];
    public double? Rating { get; init; }
    public int? RuntimeMinutes { get; init; }
    public int? TmdbId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

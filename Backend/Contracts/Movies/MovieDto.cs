namespace Contracts.Movies;

public sealed class MovieDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? OriginalTitle { get; set; }
    public int? Year { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? PosterUrl { get; set; }
    public string? BackdropUrl { get; set; }
    public string? Overview { get; set; }
    public List<string> Genres { get; set; } = [];
    public double? Rating { get; set; }
    public int? RuntimeMinutes { get; set; }
    public int? TmdbId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

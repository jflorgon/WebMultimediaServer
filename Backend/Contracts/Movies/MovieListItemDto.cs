namespace Contracts.Movies;

public sealed class MovieListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? Year { get; set; }
    public string? PosterUrl { get; set; }
    public double? Rating { get; set; }
    public List<string> Genres { get; set; } = [];
}

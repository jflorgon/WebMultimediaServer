namespace Contracts.Documentaries;

public sealed record DocumentaryListItemDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public int? Year { get; init; }
    public string? PosterUrl { get; init; }
    public double? Rating { get; init; }
    public List<string> Genres { get; init; } = [];
}

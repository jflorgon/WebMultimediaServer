namespace Contracts.Series;

public sealed record EpisodeListItemDto(
    Guid Id,
    int SeasonNumber,
    int EpisodeNumber,
    string Title,
    string FilePath);

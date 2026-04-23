using System.Text.Json.Serialization;

namespace API.Scanner.Models;

public sealed class TmdbMovieResult
{
    [JsonPropertyName("id")]
    public int Id { get; set; }
    [JsonPropertyName("title")]
    public string? Title { get; set; }
    [JsonPropertyName("original_title")]
    public string? OriginalTitle { get; set; }
    [JsonPropertyName("overview")]
    public string? Overview { get; set; }
    [JsonPropertyName("release_date")]
    public string? ReleaseDate { get; set; }
    [JsonPropertyName("poster_path")]
    public string? PosterPath { get; set; }
    [JsonPropertyName("backdrop_path")]
    public string? BackdropPath { get; set; }
    [JsonPropertyName("vote_average")]
    public double VoteAverage { get; set; }
    [JsonPropertyName("genre_ids")]
    public List<int> GenreIds { get; set; } = [];
    [JsonPropertyName("runtime")]
    public int? Runtime { get; set; }
}

public sealed class TmdbTvResult
{
    [JsonPropertyName("id")]
    public int Id { get; set; }
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    [JsonPropertyName("original_name")]
    public string? OriginalName { get; set; }
    [JsonPropertyName("overview")]
    public string? Overview { get; set; }
    [JsonPropertyName("first_air_date")]
    public string? FirstAirDate { get; set; }
    [JsonPropertyName("poster_path")]
    public string? PosterPath { get; set; }
    [JsonPropertyName("backdrop_path")]
    public string? BackdropPath { get; set; }
    [JsonPropertyName("vote_average")]
    public double VoteAverage { get; set; }
    [JsonPropertyName("genre_ids")]
    public List<int> GenreIds { get; set; } = [];
    [JsonPropertyName("number_of_seasons")]
    public int? NumberOfSeasons { get; set; }
    [JsonPropertyName("number_of_episodes")]
    public int? NumberOfEpisodes { get; set; }
}

public sealed class TmdbSearchResponse<T>
{
    [JsonPropertyName("results")]
    public List<T> Results { get; set; } = [];
}

public sealed class TmdbGenre
{
    [JsonPropertyName("id")]
    public int Id { get; set; }
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public sealed class TmdbGenreResponse
{
    [JsonPropertyName("genres")]
    public List<TmdbGenre> Genres { get; set; } = [];
}

namespace Contracts.Common;

public sealed class FilterParams
{
    public string? Title { get; set; }
    public string? Genre { get; set; }
    public int? Year { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

namespace API.Scanner.Models;

public sealed class ScannerOptions
{
    public List<string> MediaPaths { get; set; } = [];
    public int IntervalMinutes { get; set; } = 60;
    public List<string> VideoExtensions { get; set; } = [".mkv", ".mp4", ".avi", ".mov", ".wmv"];
}

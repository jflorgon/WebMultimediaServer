namespace Contracts.Scanner;

public sealed record ScannerStatusDto
{
    public bool IsRunning { get; init; }
    public DateTime? LastRunAt { get; init; }
    public string? LastResult { get; init; }
    public int ItemsScanned { get; init; }
}

namespace Contracts.Scanner;

public sealed class ScannerStatusDto
{
    public bool IsRunning { get; set; }
    public DateTime? LastRunAt { get; set; }
    public string? LastResult { get; set; }
    public int ItemsScanned { get; set; }
}

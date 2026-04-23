using Application.Common.Interfaces;
using Contracts.Scanner;

namespace API.Scanner.Services;

public sealed class ScannerStatusService : IScannerStatusService
{
    private volatile bool _isRunning;
    private volatile bool _scanRequested;
    private DateTime? _lastRunAt;
    private string? _lastResult;
    private int _itemsScanned;

    public ScannerStatusDto GetStatus() => new()
    {
        IsRunning = _isRunning,
        LastRunAt = _lastRunAt,
        LastResult = _lastResult,
        ItemsScanned = _itemsScanned
    };

    public void SetRunning(bool isRunning) => _isRunning = isRunning;
    public bool IsScanRequested => _scanRequested;
    public void RequestScan() => _scanRequested = true;
    public void ClearScanRequest() => _scanRequested = false;

    public void SetCompleted(int itemsScanned)
    {
        _isRunning = false;
        _lastRunAt = DateTime.UtcNow;
        _lastResult = $"Completado. {itemsScanned} elementos procesados.";
        _itemsScanned = itemsScanned;
    }

    public void SetFailed(string error)
    {
        _isRunning = false;
        _lastRunAt = DateTime.UtcNow;
        _lastResult = $"Error: {error}";
    }
}

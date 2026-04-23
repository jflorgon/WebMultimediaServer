using Contracts.Scanner;

namespace Application.Common.Interfaces;

public interface IScannerStatusService
{
    ScannerStatusDto GetStatus();
    void SetRunning(bool isRunning);
    void SetCompleted(int itemsScanned);
    void SetFailed(string error);
    void RequestScan();
    bool IsScanRequested { get; }
    void ClearScanRequest();
}

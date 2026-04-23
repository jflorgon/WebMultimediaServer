namespace API.Scanner.Services;

public interface IMediaScannerService
{
    Task<int> ScanAsync(CancellationToken cancellationToken = default);
}

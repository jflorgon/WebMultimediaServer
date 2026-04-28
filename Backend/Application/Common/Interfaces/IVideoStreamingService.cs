namespace Application.Common.Interfaces;

public interface IHlsStreamingService
{
    Task<string> EnsureHlsReadyAsync(Guid id, string filePath, CancellationToken ct);
    string GetSegmentPath(Guid id, string filename);
}

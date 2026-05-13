namespace Application.Common.Interfaces;

public interface IHlsStreamingService
{
    Task<string> EnsureHlsReadyAsync(Guid id, string filePath, CancellationToken ct);
    string GetSegmentPath(Guid id, string filename);

    /// <summary>
    /// Renueva el "latido" del cliente. Si pasan más de unos segundos sin heartbeat
    /// el servicio cancela el proceso FFmpeg asociado para liberar CPU.
    /// </summary>
    void RegisterHeartbeat(Guid id);
}

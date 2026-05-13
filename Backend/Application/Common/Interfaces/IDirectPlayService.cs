namespace Application.Common.Interfaces;

public sealed record DirectPlayInfo(
    string FilePath,
    string MimeType,
    long SizeBytes);

public interface IDirectPlayService
{
    /// <summary>
    /// Decide si el fichero puede servirse en directo (sin FFmpeg) al cliente.
    /// Devuelve <c>null</c> si NO es apto y debe usarse HLS.
    /// Criterios actuales: vídeo H.264 (yuv420p, 8-bit) + audio AAC, cualquier contenedor.
    /// </summary>
    Task<DirectPlayInfo?> ProbeAsync(string filePath, CancellationToken ct);
}

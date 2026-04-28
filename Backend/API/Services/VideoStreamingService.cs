using System.Collections.Concurrent;
using System.Diagnostics;
using Application.Common.Interfaces;

namespace API.Services;

public sealed class HlsStreamingService : IHlsStreamingService, IDisposable
{
    private static readonly TimeSpan TtlIdle = TimeSpan.FromHours(2);
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromMinutes(30);

    private readonly ILogger<HlsStreamingService> _logger;
    private readonly ConcurrentDictionary<Guid, byte> _running = new();
    private readonly ConcurrentDictionary<Guid, DateTime> _lastAccessed = new();
    private readonly Timer _cleanupTimer;

    public HlsStreamingService(ILogger<HlsStreamingService> logger)
    {
        _logger = logger;
        _cleanupTimer = new Timer(RunCleanup, null, CleanupInterval, CleanupInterval);
    }

    public async Task<string> EnsureHlsReadyAsync(Guid id, string filePath, CancellationToken ct)
    {
        if (!File.Exists(filePath))
            throw new FileNotFoundException("Fichero de vídeo no encontrado en disco", filePath);

        var tempDir = GetTempDir(id);
        var playlistPath = Path.Combine(tempDir, "playlist.m3u8");

        _lastAccessed[id] = DateTime.UtcNow;

        if (File.Exists(playlistPath))
            return tempDir;

        Directory.CreateDirectory(tempDir);

        if (_running.TryAdd(id, 0))
            _ = Task.Run(() => RunFfmpegAsync(id, filePath, tempDir), CancellationToken.None);

        var deadline = DateTime.UtcNow.AddSeconds(120);
        while (!File.Exists(playlistPath) && DateTime.UtcNow < deadline)
        {
            ct.ThrowIfCancellationRequested();
            await Task.Delay(400, ct);
        }

        if (!File.Exists(playlistPath))
            throw new TimeoutException($"HLS no disponible después de 120s para ID: {id}");

        return tempDir;
    }

    public string GetSegmentPath(Guid id, string filename)
    {
        _lastAccessed[id] = DateTime.UtcNow;
        return Path.Combine(GetTempDir(id), filename);
    }

    private static string GetTempDir(Guid id) =>
        Path.Combine(Path.GetTempPath(), "mediaserver-hls", id.ToString());

    private void RunCleanup(object? state)
    {
        var baseDir = Path.Combine(Path.GetTempPath(), "mediaserver-hls");
        if (!Directory.Exists(baseDir)) return;

        var cutoff = DateTime.UtcNow - TtlIdle;

        foreach (var dir in Directory.GetDirectories(baseDir))
        {
            var dirName = Path.GetFileName(dir);
            if (!Guid.TryParse(dirName, out var id)) continue;
            if (_running.ContainsKey(id)) continue;

            _lastAccessed.TryGetValue(id, out var lastAccess);
            if (lastAccess == default)
                lastAccess = new DirectoryInfo(dir).LastWriteTimeUtc;

            if (lastAccess >= cutoff) continue;

            try
            {
                Directory.Delete(dir, recursive: true);
                _lastAccessed.TryRemove(id, out _);
                _logger.LogInformation(
                    "HLS caché expirado eliminado para {Id} (último acceso: {LastAccess:u})",
                    id, lastAccess);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo eliminar HLS caché para {Id}", id);
            }
        }
    }

    private async Task RunFfmpegAsync(Guid id, string filePath, string tempDir)
    {
        var segmentPattern = Path.Combine(tempDir, "seg%03d.ts");
        var playlistPath = Path.Combine(tempDir, "playlist.m3u8");

        var videoCodec = await DetectVideoCodecAsync(filePath);
        var videoArgs = videoCodec == "h264"
            ? "-c:v copy"
            : "-c:v libx264 -preset fast -crf 22";

        _logger.LogInformation("Codec detectado para {Id}: {Codec} → {Args}", id, videoCodec, videoArgs);

        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "ffmpeg",
                // +igndts: ignora DTS corruptos del AVI; -ac 2: fuerza estéreo (AVI 5.1 causa bufferAppendError en HLS.js)
                Arguments = $"-fflags +genpts+igndts -avoid_negative_ts make_zero -i \"{filePath}\" " +
                            $"{videoArgs} -c:a aac -ac 2 -ar 48000 -b:a 192k " +
                            $"-af aresample=async=1000 " +
                            $"-max_muxing_queue_size 9999 " +
                            $"-hls_time 6 -hls_list_size 0 " +
                            $"-hls_segment_filename \"{segmentPattern}\" -f hls \"{playlistPath}\"",
                UseShellExecute = false,
                RedirectStandardError = true,
                CreateNoWindow = true,
            }
        };

        try
        {
            process.Start();
            _logger.LogInformation("FFmpeg HLS iniciado para {Id}: {FilePath}", id, filePath);
            await process.WaitForExitAsync();
            _logger.LogInformation("FFmpeg HLS finalizado para {Id}, código: {Code}", id, process.ExitCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ejecutando FFmpeg para {Id}", id);
        }
        finally
        {
            _running.TryRemove(id, out _);
        }
    }

    private static async Task<string> DetectVideoCodecAsync(string filePath)
    {
        using var probe = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "ffprobe",
                Arguments = $"-v quiet -select_streams v:0 -show_entries stream=codec_name " +
                            $"-of default=noprint_wrappers=1:nokey=1 \"{filePath}\"",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                CreateNoWindow = true,
            }
        };
        probe.Start();
        var codec = (await probe.StandardOutput.ReadToEndAsync()).Trim().ToLowerInvariant();
        await probe.WaitForExitAsync();
        return codec;
    }

    public void Dispose() => _cleanupTimer.Dispose();
}

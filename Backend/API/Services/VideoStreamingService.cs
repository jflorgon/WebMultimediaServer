using System.Collections.Concurrent;
using System.Diagnostics;
using Application.Common.Interfaces;

namespace API.Services;

public sealed class HlsStreamingService : IHlsStreamingService, IDisposable
{
    private static readonly TimeSpan TtlIdle = TimeSpan.FromHours(2);
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromMinutes(30);

    // Si el cliente deja de mandar keep-alive durante más de este tiempo, matamos el FFmpeg.
    // 90 s tolera pausas largas (el frontend manda heartbeat cada 30 s) y aún así libera
    // CPU rápidamente cuando el usuario abandona la página sin avisar.
    private static readonly TimeSpan HeartbeatTimeout = TimeSpan.FromSeconds(90);
    private static readonly TimeSpan HeartbeatCheckInterval = TimeSpan.FromSeconds(15);

    private readonly ILogger<HlsStreamingService> _logger;
    private readonly ConcurrentDictionary<Guid, byte> _running = new();
    private readonly ConcurrentDictionary<Guid, DateTime> _lastAccessed = new();
    private readonly ConcurrentDictionary<Guid, DateTime> _lastHeartbeat = new();
    private readonly ConcurrentDictionary<Guid, CancellationTokenSource> _ffmpegCts = new();
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
        _lastHeartbeat[id] = DateTime.UtcNow;

        if (File.Exists(playlistPath))
        {
            // Reusamos el playlist sólo si:
            //  - hay un FFmpeg vivo en esta instancia llenándolo todavía, o
            //  - el playlist está completo (tiene #EXT-X-ENDLIST al final).
            // Si no, es un playlist huérfano (típico tras reiniciar la API): el cliente
            // reproduciría los .ts cacheados, llegaría al último listado, y se quedaría
            // colgado esperando segmentos que nadie está produciendo. Hay que rearrancar.
            if (_running.ContainsKey(id) || await IsPlaylistCompleteAsync(playlistPath, ct))
                return tempDir;

            _logger.LogInformation(
                "Playlist HLS huérfano detectado para {Id} (sin FFmpeg activo y sin ENDLIST). Limpiando y rearrancando transcodificación.",
                id);
            try { Directory.Delete(tempDir, recursive: true); }
            catch (Exception ex) { _logger.LogWarning(ex, "No se pudo limpiar {TempDir}", tempDir); }
        }

        Directory.CreateDirectory(tempDir);

        if (_running.TryAdd(id, 0))
        {
            var cts = new CancellationTokenSource();
            _ffmpegCts[id] = cts;
            _ = Task.Run(() => RunFfmpegAsync(id, filePath, tempDir, cts.Token), CancellationToken.None);
            _ = Task.Run(() => WatchHeartbeatAsync(id, cts));
        }

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
        _lastHeartbeat[id] = DateTime.UtcNow;
        return Path.Combine(GetTempDir(id), filename);
    }

    public void RegisterHeartbeat(Guid id)
    {
        _lastHeartbeat[id] = DateTime.UtcNow;
        _lastAccessed[id] = DateTime.UtcNow;
    }

    private static string GetTempDir(Guid id) =>
        Path.Combine(Path.GetTempPath(), "mediaserver-hls", id.ToString());

    // Detecta si un playlist HLS está completo (FFmpeg cerró con éxito) buscando el tag
    // #EXT-X-ENDLIST cerca del final del fichero. Sólo lee los últimos bytes para no
    // cargar playlists largos enteros en memoria.
    private static async Task<bool> IsPlaylistCompleteAsync(string playlistPath, CancellationToken ct)
    {
        try
        {
            await using var fs = new FileStream(
                playlistPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            if (fs.Length == 0) return false;

            var len = (int)Math.Min(256, fs.Length);
            fs.Seek(-len, SeekOrigin.End);
            var buf = new byte[len];
            var read = await fs.ReadAsync(buf.AsMemory(0, len), ct);
            return System.Text.Encoding.UTF8.GetString(buf, 0, read).Contains("#EXT-X-ENDLIST");
        }
        catch
        {
            return false;
        }
    }

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

    private async Task WatchHeartbeatAsync(Guid id, CancellationTokenSource cts)
    {
        while (!cts.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(HeartbeatCheckInterval, cts.Token);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            if (!_lastHeartbeat.TryGetValue(id, out var last)) continue;

            if (DateTime.UtcNow - last > HeartbeatTimeout)
            {
                _logger.LogInformation(
                    "Cancelando FFmpeg para {Id}: último heartbeat hace {Elapsed:F0}s",
                    id, (DateTime.UtcNow - last).TotalSeconds);
                cts.Cancel();
                return;
            }
        }
    }

    private async Task RunFfmpegAsync(Guid id, string filePath, string tempDir, CancellationToken ct)
    {
        var segmentPattern = Path.Combine(tempDir, "seg%03d.ts");
        var playlistPath = Path.Combine(tempDir, "playlist.m3u8");

        var videoCodec = await DetectVideoCodecAsync(filePath);
        // preset=veryfast: ~3× más rápido que `fast` en Q6850 (4 cores, sin AES-NI/AVX),
        // mejor paralelización entre cores, calidad casi idéntica al mismo CRF.
        // Necesario porque con `fast` el ratio caía a ~0.88x tiempo real y el player
        // alcanzaba la live edge causando paradas.
        var videoArgs = videoCodec == "h264"
            ? "-c:v copy"
            : "-c:v libx264 -preset veryfast -crf 22";

        _logger.LogInformation("Codec detectado para {Id}: {Codec} → {Args}", id, videoCodec, videoArgs);

        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "ffmpeg",
                // +igndts: ignora DTS corruptos del AVI; -ac 2: fuerza estéreo (AVI 5.1 causa bufferAppendError en HLS.js)
                // Audio: 256k AAC LC sin filtro de loudness. Pasamos solo por aresample para
                // corregir desync de audio. Antes probamos loudnorm (EBU R128 → bottleneck a
                // 0.65× tiempo real) y dynaudnorm (más rápido pero sonaba "hueco" por la
                // compresión dinámica). Preferimos respetar la dinámica original; si una peli
                // suena floja, se sube el volumen del TV.
                Arguments = $"-fflags +genpts+igndts -avoid_negative_ts make_zero -i \"{filePath}\" " +
                            $"{videoArgs} -c:a aac -profile:a aac_low -ac 2 -ar 48000 -b:a 256k " +
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
            // Drena stderr continuamente para que FFmpeg no bloquee cuando el pipe buffer se llena
            _ = process.StandardError.BaseStream.CopyToAsync(Stream.Null);
            _logger.LogInformation("FFmpeg HLS iniciado para {Id}: {FilePath}", id, filePath);

            try
            {
                await process.WaitForExitAsync(ct);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("FFmpeg cancelado para {Id} (heartbeat timeout)", id);
                try { if (!process.HasExited) process.Kill(entireProcessTree: true); }
                catch (Exception killEx) { _logger.LogWarning(killEx, "Error matando FFmpeg para {Id}", id); }
            }

            _logger.LogInformation("FFmpeg HLS finalizado para {Id}, código: {Code}", id, process.ExitCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ejecutando FFmpeg para {Id}", id);
        }
        finally
        {
            _running.TryRemove(id, out _);
            if (_ffmpegCts.TryRemove(id, out var heartbeatCts))
            {
                heartbeatCts.Cancel();
                heartbeatCts.Dispose();
            }
            _lastHeartbeat.TryRemove(id, out _);
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

    public void Dispose()
    {
        _cleanupTimer.Dispose();
        foreach (var cts in _ffmpegCts.Values)
        {
            try { cts.Cancel(); cts.Dispose(); } catch { /* no-op */ }
        }
    }
}

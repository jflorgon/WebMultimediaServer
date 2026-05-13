using System.Diagnostics;
using System.Text.Json;
using Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace API.Services;

public sealed class DirectPlayService(
    IOptions<StreamingOptions> options,
    ILogger<DirectPlayService> logger) : IDirectPlayService
{
    public async Task<DirectPlayInfo?> ProbeAsync(string filePath, CancellationToken ct)
    {
        if (!options.Value.DirectPlayEnabled) return null;
        if (!File.Exists(filePath)) return null;

        try
        {
            var json = await RunFfprobeAsync(filePath, ct);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            string? videoCodec = null, audioCodec = null, pixFmt = null;
            int videoBitDepth = 0;
            if (root.TryGetProperty("streams", out var streams))
            {
                foreach (var s in streams.EnumerateArray())
                {
                    var codecType = s.TryGetProperty("codec_type", out var ct1) ? ct1.GetString() : null;
                    var codecName = s.TryGetProperty("codec_name", out var cn) ? cn.GetString() : null;

                    if (codecType == "video" && videoCodec is null)
                    {
                        videoCodec = codecName;
                        if (s.TryGetProperty("pix_fmt", out var pf)) pixFmt = pf.GetString();
                        if (s.TryGetProperty("bits_per_raw_sample", out var bd) && int.TryParse(bd.GetString(), out var n)) videoBitDepth = n;
                    }
                    else if (codecType == "audio" && audioCodec is null)
                    {
                        audioCodec = codecName;
                    }
                }
            }

            // Criterios: vídeo H.264, pixel format yuv420p (8-bit), audio AAC.
            // Si el bit depth no se reporta se asume 8 (mayoría de H.264 yuv420p).
            var eligible =
                string.Equals(videoCodec, "h264", StringComparison.OrdinalIgnoreCase) &&
                (pixFmt?.StartsWith("yuv420p", StringComparison.OrdinalIgnoreCase) ?? false) &&
                !pixFmt.Contains("10", StringComparison.OrdinalIgnoreCase) &&
                (videoBitDepth == 0 || videoBitDepth == 8) &&
                string.Equals(audioCodec, "aac", StringComparison.OrdinalIgnoreCase);

            if (!eligible)
            {
                logger.LogDebug(
                    "Direct play denegado para {File}: video={V} pix={P} bit={B} audio={A}",
                    filePath, videoCodec, pixFmt, videoBitDepth, audioCodec);
                return null;
            }

            var size = new FileInfo(filePath).Length;
            var mime = GuessMime(filePath);
            logger.LogInformation("Direct play OK para {File} ({Mime}, {Size} bytes)", filePath, mime, size);
            return new DirectPlayInfo(filePath, mime, size);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error probando direct play para {File}", filePath);
            return null;
        }
    }

    private static async Task<string> RunFfprobeAsync(string filePath, CancellationToken ct)
    {
        using var probe = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "ffprobe",
                Arguments = "-v quiet -print_format json " +
                            "-show_entries stream=codec_name,codec_type,pix_fmt,bits_per_raw_sample " +
                            $"\"{filePath}\"",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                CreateNoWindow = true,
            }
        };
        probe.Start();
        var output = await probe.StandardOutput.ReadToEndAsync(ct);
        await probe.WaitForExitAsync(ct);
        return output;
    }

    private static string GuessMime(string filePath)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        return ext switch
        {
            ".mp4" or ".m4v" => "video/mp4",
            ".mkv" => "video/x-matroska",
            ".webm" => "video/webm",
            ".mov" => "video/quicktime",
            _ => "application/octet-stream",
        };
    }
}

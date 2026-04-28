using System.Text.RegularExpressions;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/streaming")]
public sealed partial class StreamingController(
    IApplicationDbContext db,
    IHlsStreamingService hlsService,
    ILogger<StreamingController> logger) : ControllerBase
{
    [HttpGet("movies/{id:guid}/playlist.m3u8")]
    public async Task GetMoviePlaylist(Guid id, CancellationToken ct)
    {
        var movie = await db.Movies.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (movie is null) { Response.StatusCode = 404; return; }
        await ServePlaylistAsync(id, movie.FilePath, "movies", ct);
    }

    [HttpGet("movies/{id:guid}/{filename}")]
    public async Task GetMovieSegment(Guid id, string filename, CancellationToken ct) =>
        await ServeSegmentAsync(id, filename, ct);

    [HttpGet("documentaries/{id:guid}/playlist.m3u8")]
    public async Task GetDocumentaryPlaylist(Guid id, CancellationToken ct)
    {
        var doc = await db.Documentaries.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (doc is null) { Response.StatusCode = 404; return; }
        await ServePlaylistAsync(id, doc.FilePath, "documentaries", ct);
    }

    [HttpGet("documentaries/{id:guid}/{filename}")]
    public async Task GetDocumentarySegment(Guid id, string filename, CancellationToken ct) =>
        await ServeSegmentAsync(id, filename, ct);

    [HttpGet("episodes/{id:guid}/playlist.m3u8")]
    public async Task GetEpisodePlaylist(Guid id, CancellationToken ct)
    {
        var episode = await db.Episodes.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (episode is null) { Response.StatusCode = 404; return; }
        await ServePlaylistAsync(id, episode.FilePath, "episodes", ct);
    }

    [HttpGet("episodes/{id:guid}/{filename}")]
    public async Task GetEpisodeSegment(Guid id, string filename, CancellationToken ct) =>
        await ServeSegmentAsync(id, filename, ct);

    private async Task ServePlaylistAsync(Guid id, string filePath, string mediaType, CancellationToken ct)
    {
        try
        {
            var tempDir = await hlsService.EnsureHlsReadyAsync(id, filePath, ct);
            var playlistPath = Path.Combine(tempDir, "playlist.m3u8");
            var content = await System.IO.File.ReadAllTextAsync(playlistPath, ct);

            // Rewrite relative segment names to absolute API paths
            var baseUrl = $"/api/streaming/{mediaType}/{id}";
            content = SegmentLineRegex().Replace(content, m => $"{baseUrl}/{m.Value}");

            Response.ContentType = "application/vnd.apple.mpegurl";
            Response.Headers["Cache-Control"] = "no-cache";
            await Response.WriteAsync(content, ct);
        }
        catch (FileNotFoundException ex)
        {
            logger.LogWarning(ex, "Fichero no encontrado para streaming {Id}", id);
            if (!Response.HasStarted) Response.StatusCode = 400;
        }
        catch (TimeoutException ex)
        {
            logger.LogError(ex, "Timeout generando HLS para {Id}", id);
            if (!Response.HasStarted) Response.StatusCode = 503;
        }
    }

    private async Task ServeSegmentAsync(Guid id, string filename, CancellationToken ct)
    {
        if (!SegmentFilenameRegex().IsMatch(filename))
        {
            Response.StatusCode = 400;
            return;
        }

        var segmentPath = hlsService.GetSegmentPath(id, filename);

        var deadline = DateTime.UtcNow.AddSeconds(30);
        while (!System.IO.File.Exists(segmentPath) && DateTime.UtcNow < deadline)
        {
            ct.ThrowIfCancellationRequested();
            await Task.Delay(200, ct);
        }

        if (!System.IO.File.Exists(segmentPath))
        {
            Response.StatusCode = 404;
            return;
        }

        Response.ContentType = "video/mp2t";
        Response.Headers["Cache-Control"] = "public, max-age=3600";
        await Response.SendFileAsync(segmentPath, ct);
    }

    [GeneratedRegex(@"^seg\d+\.ts$", RegexOptions.Multiline)]
    private static partial Regex SegmentLineRegex();

    [GeneratedRegex(@"^seg\d+\.ts$")]
    private static partial Regex SegmentFilenameRegex();
}

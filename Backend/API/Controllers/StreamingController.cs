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
    IDirectPlayService directPlayService,
    ILogger<StreamingController> logger) : ControllerBase
{
    // ---------- Source resolver: decide HLS vs direct play ----------

    [HttpGet("movies/{id:guid}/source")]
    public async Task<IActionResult> GetMovieSource(Guid id, CancellationToken ct)
    {
        var movie = await db.Movies.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (movie is null) return NotFound();
        return await BuildSourceAsync(id, movie.FilePath, "movies", ct);
    }

    [HttpGet("documentaries/{id:guid}/source")]
    public async Task<IActionResult> GetDocumentarySource(Guid id, CancellationToken ct)
    {
        var doc = await db.Documentaries.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (doc is null) return NotFound();
        return await BuildSourceAsync(id, doc.FilePath, "documentaries", ct);
    }

    [HttpGet("episodes/{id:guid}/source")]
    public async Task<IActionResult> GetEpisodeSource(Guid id, CancellationToken ct)
    {
        var episode = await db.Episodes.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (episode is null) return NotFound();
        return await BuildSourceAsync(id, episode.FilePath, "episodes", ct);
    }

    // ---------- Direct play (stream raw file con Range) ----------

    [HttpGet("movies/{id:guid}/direct")]
    public async Task<IActionResult> GetMovieDirect(Guid id, CancellationToken ct)
    {
        var movie = await db.Movies.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (movie is null) return NotFound();
        return await ServeDirectAsync(movie.FilePath, ct);
    }

    [HttpGet("documentaries/{id:guid}/direct")]
    public async Task<IActionResult> GetDocumentaryDirect(Guid id, CancellationToken ct)
    {
        var doc = await db.Documentaries.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (doc is null) return NotFound();
        return await ServeDirectAsync(doc.FilePath, ct);
    }

    [HttpGet("episodes/{id:guid}/direct")]
    public async Task<IActionResult> GetEpisodeDirect(Guid id, CancellationToken ct)
    {
        var episode = await db.Episodes.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (episode is null) return NotFound();
        return await ServeDirectAsync(episode.FilePath, ct);
    }

    // ---------- HLS ----------

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

    // ---------- Keep-alive (heartbeat para no matar FFmpeg en pausas largas) ----------

    [HttpPost("keep-alive/{id:guid}")]
    public IActionResult KeepAlive(Guid id)
    {
        hlsService.RegisterHeartbeat(id);
        return NoContent();
    }

    // ---------- Internals ----------

    private async Task<IActionResult> BuildSourceAsync(Guid id, string filePath, string mediaType, CancellationToken ct)
    {
        var info = await directPlayService.ProbeAsync(filePath, ct);
        if (info is not null)
        {
            return Ok(new
            {
                mode = "direct",
                url = $"/api/streaming/{mediaType}/{id}/direct",
                mime = info.MimeType,
            });
        }
        return Ok(new
        {
            mode = "hls",
            url = $"/api/streaming/{mediaType}/{id}/playlist.m3u8",
            mime = "application/vnd.apple.mpegurl",
        });
    }

    private async Task<IActionResult> ServeDirectAsync(string filePath, CancellationToken ct)
    {
        var info = await directPlayService.ProbeAsync(filePath, ct);
        if (info is null)
        {
            // Defensa: nunca servir directo algo que el probe rechazó (códec incompatible, fichero borrado…)
            return BadRequest("Fichero no apto para direct play");
        }
        return PhysicalFile(info.FilePath, info.MimeType, enableRangeProcessing: true);
    }

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

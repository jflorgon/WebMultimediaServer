using Application.Movies.Commands.UpsertMovie;
using FluentAssertions;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Application.Tests.Movies;

public sealed class UpsertMovieCommandHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly UpsertMovieCommandHandler _handler;

    public UpsertMovieCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ApplicationDbContext(options);
        _handler = new UpsertMovieCommandHandler(_db);
    }

    private static UpsertMovieCommand BuildCommand(string filePath = "/movies/matrix.mkv", string title = "Matrix")
        => new(filePath, title, null, 1999, null, null, null, [], 8.7, 136, 603);

    [Fact]
    public async Task Handle_InsertsMovie_WhenFilePathIsNew()
    {
        var command = BuildCommand();
        var id = await _handler.Handle(command, CancellationToken.None);

        var movie = await _db.Movies.FindAsync(id);
        movie.Should().NotBeNull();
        movie!.Title.Should().Be("Matrix");
        movie.TmdbId.Should().Be(603);
    }

    [Fact]
    public async Task Handle_UpdatesMovie_WhenFilePathExists()
    {
        var command = BuildCommand();
        var id1 = await _handler.Handle(command, CancellationToken.None);

        var movie = await _db.Movies.FindAsync(id1);
        movie!.UpdatedAt = DateTime.UtcNow.AddDays(-181);
        _db.SaveChanges();

        var updated = command with { Title = "The Matrix", TmdbId = 603 };
        var id2 = await _handler.Handle(updated, CancellationToken.None);

        id1.Should().Be(id2);
        movie = await _db.Movies.FindAsync(id1);
        movie!.Title.Should().Be("The Matrix");
    }

    [Fact]
    public async Task Handle_CreatesTwoMovies_WhenFilePathsDiffer()
    {
        await _handler.Handle(BuildCommand("/a.mkv", "Movie A"), CancellationToken.None);
        await _handler.Handle(BuildCommand("/b.mkv", "Movie B"), CancellationToken.None);

        _db.Movies.Count().Should().Be(2);
    }

    public void Dispose() => _db.Dispose();
}

using Application.Mappings;
using Application.Movies.Queries.GetMovies;
using AutoMapper;
using Domain.Entities;
using FluentAssertions;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Application.Tests.Movies;

public sealed class GetMoviesQueryHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly GetMoviesQueryHandler _handler;

    public GetMoviesQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ApplicationDbContext(options);
        _mapper = new MapperConfiguration(cfg => cfg.AddProfile<MovieMappingProfile>()).CreateMapper();
        _handler = new GetMoviesQueryHandler(_db, _mapper);
    }

    [Fact]
    public async Task Handle_ReturnsAllMovies_WhenNoFilters()
    {
        _db.Movies.AddRange(
            new Movie { Id = Guid.NewGuid(), Title = "Matrix", FilePath = "/a.mkv", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Movie { Id = Guid.NewGuid(), Title = "Inception", FilePath = "/b.mkv", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetMoviesQuery(null, null, null), CancellationToken.None);

        result.TotalCount.Should().Be(2);
        result.Items.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_FiltersByTitle()
    {
        _db.Movies.AddRange(
            new Movie { Id = Guid.NewGuid(), Title = "Matrix", FilePath = "/a.mkv", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Movie { Id = Guid.NewGuid(), Title = "Inception", FilePath = "/b.mkv", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetMoviesQuery("matrix", null, null), CancellationToken.None);

        result.TotalCount.Should().Be(1);
        result.Items[0].Title.Should().Be("Matrix");
    }

    [Fact]
    public async Task Handle_ReturnsCorrectPage()
    {
        for (int i = 1; i <= 5; i++)
            _db.Movies.Add(new Movie { Id = Guid.NewGuid(), Title = $"Movie {i}", FilePath = $"/m{i}.mkv", CreatedAt = DateTime.UtcNow.AddSeconds(i), UpdatedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetMoviesQuery(null, null, null, Page: 2, PageSize: 2), CancellationToken.None);

        result.TotalCount.Should().Be(5);
        result.Items.Should().HaveCount(2);
        result.TotalPages.Should().Be(3);
        result.HasNextPage.Should().BeTrue();
        result.HasPreviousPage.Should().BeTrue();
    }

    public void Dispose() => _db.Dispose();
}

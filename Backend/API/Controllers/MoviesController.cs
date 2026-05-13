using Application.Movies.Queries.GetHeroMovies;
using Application.Movies.Queries.GetMovieById;
using Application.Movies.Queries.GetMovieGenres;
using Application.Movies.Queries.GetMovies;
using Contracts.Common;
using Contracts.Movies;
using Core.Pagination;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/movies")]
public sealed class MoviesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<MovieListItemDto>>> GetAll(
        [FromQuery] FilterParams filters,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new GetMoviesQuery(filters.Title, filters.Genre, filters.Year, filters.Page, filters.PageSize),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MovieDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetMovieByIdQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("genres")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetGenres(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetMovieGenresQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("hero")]
    public async Task<ActionResult<IReadOnlyList<MovieListItemDto>>> GetHero(
        [FromQuery] int count = 4,
        [FromQuery] double minRating = 6.0,
        CancellationToken cancellationToken = default)
    {
        var result = await mediator.Send(new GetHeroMoviesQuery(count, minRating), cancellationToken);
        Response.Headers["Cache-Control"] = "no-store";
        return Ok(result);
    }
}

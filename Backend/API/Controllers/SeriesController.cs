using Application.Series.Queries.GetEpisodesBySeries;
using Application.Series.Queries.GetSeries;
using Application.Series.Queries.GetSeriesById;
using Contracts.Common;
using Contracts.Series;
using Core.Pagination;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/series")]
public sealed class SeriesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<SeriesListItemDto>>> GetAll(
        [FromQuery] FilterParams filters,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new GetSeriesQuery(filters.Title, filters.Genre, filters.Year, filters.Page, filters.PageSize),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SeriesDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetSeriesByIdQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{id:guid}/episodes")]
    public async Task<ActionResult<IReadOnlyList<EpisodeListItemDto>>> GetEpisodes(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetEpisodesBySeriesQuery(id), cancellationToken);
        return Ok(result);
    }
}

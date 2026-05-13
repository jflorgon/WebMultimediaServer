using Application.Documentaries.Queries.GetDocumentaries;
using Application.Documentaries.Queries.GetDocumentaryById;
using Application.Documentaries.Queries.GetDocumentaryGenres;
using Application.Documentaries.Queries.GetHeroDocumentaries;
using Contracts.Common;
using Contracts.Documentaries;
using Core.Pagination;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/documentaries")]
public sealed class DocumentariesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<DocumentaryListItemDto>>> GetAll(
        [FromQuery] FilterParams filters,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new GetDocumentariesQuery(filters.Title, filters.Genre, filters.Year, filters.Page, filters.PageSize),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DocumentaryDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetDocumentaryByIdQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("genres")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetGenres(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetDocumentaryGenresQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("hero")]
    public async Task<ActionResult<IReadOnlyList<DocumentaryListItemDto>>> GetHero(
        [FromQuery] int count = 2,
        [FromQuery] double minRating = 6.0,
        CancellationToken cancellationToken = default)
    {
        var result = await mediator.Send(new GetHeroDocumentariesQuery(count, minRating), cancellationToken);
        Response.Headers["Cache-Control"] = "no-store";
        return Ok(result);
    }
}

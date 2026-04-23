using Application.Documentaries.Queries.GetDocumentaries;
using Application.Documentaries.Queries.GetDocumentaryById;
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
}

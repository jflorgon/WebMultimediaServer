using Application.Scanner.Commands.TriggerScan;
using Application.Scanner.Queries.GetScannerStatus;
using Contracts.Scanner;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/scanner")]
public sealed class ScannerController(IMediator mediator) : ControllerBase
{
    [HttpGet("status")]
    public async Task<ActionResult<ScannerStatusDto>> GetStatus(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetScannerStatusQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("trigger")]
    public async Task<IActionResult> Trigger(CancellationToken cancellationToken)
    {
        await mediator.Send(new TriggerScanCommand(), cancellationToken);
        return Accepted();
    }
}

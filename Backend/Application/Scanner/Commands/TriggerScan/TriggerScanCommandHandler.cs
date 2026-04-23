using Application.Common.Interfaces;
using MediatR;

namespace Application.Scanner.Commands.TriggerScan;

public sealed class TriggerScanCommandHandler(IScannerStatusService statusService)
    : IRequestHandler<TriggerScanCommand>
{
    public Task Handle(TriggerScanCommand request, CancellationToken cancellationToken)
    {
        statusService.RequestScan();
        return Task.CompletedTask;
    }
}

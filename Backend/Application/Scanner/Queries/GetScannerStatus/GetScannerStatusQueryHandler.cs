using Application.Common.Interfaces;
using Contracts.Scanner;
using MediatR;

namespace Application.Scanner.Queries.GetScannerStatus;

public sealed class GetScannerStatusQueryHandler(IScannerStatusService statusService)
    : IRequestHandler<GetScannerStatusQuery, ScannerStatusDto>
{
    public Task<ScannerStatusDto> Handle(GetScannerStatusQuery request, CancellationToken cancellationToken)
        => Task.FromResult(statusService.GetStatus());
}

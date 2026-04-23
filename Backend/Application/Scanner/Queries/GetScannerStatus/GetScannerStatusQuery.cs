using Contracts.Scanner;
using MediatR;

namespace Application.Scanner.Queries.GetScannerStatus;

public sealed record GetScannerStatusQuery : IRequest<ScannerStatusDto>;

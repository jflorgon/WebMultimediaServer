using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Scanner.Commands.TriggerScan;

public sealed class TriggerScanCommandHandler(
    IScannerStatusService statusService,
    IApplicationDbContext db,
    ILogger<TriggerScanCommandHandler> logger)
    : IRequestHandler<TriggerScanCommand>
{
    public async Task Handle(TriggerScanCommand request, CancellationToken cancellationToken)
    {
        if (request.Force)
        {
            // Trampolín: marcamos todas las filas como "envejecidas" para que el
            // siguiente ciclo del scanner las refresque ignorando el TTL de 180 días.
            // Esto es la vía simple para backfills (p.ej. añadir AgeRating) sin
            // tocar la lógica de Upsert.
            var old = DateTime.UtcNow.AddYears(-2);
            var movies = await db.Movies.ExecuteUpdateAsync(
                s => s.SetProperty(m => m.UpdatedAt, old), cancellationToken);
            var series = await db.Series.ExecuteUpdateAsync(
                s => s.SetProperty(m => m.UpdatedAt, old), cancellationToken);
            var docs = await db.Documentaries.ExecuteUpdateAsync(
                s => s.SetProperty(m => m.UpdatedAt, old), cancellationToken);
            logger.LogWarning(
                "Force refresh solicitado: UpdatedAt bajado a {Old} en {Movies} pelis, {Series} series y {Docs} docs.",
                old, movies, series, docs);
        }

        statusService.RequestScan();
    }
}

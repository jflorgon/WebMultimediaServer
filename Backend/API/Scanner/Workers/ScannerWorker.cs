using API.Scanner.Models;
using API.Scanner.Services;
using Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace API.Scanner.Workers;

public sealed class ScannerWorker(
    IServiceScopeFactory scopeFactory,
    IScannerStatusService statusService,
    IOptions<ScannerOptions> options,
    ILogger<ScannerWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Espera inicial para que SQL Server esté disponible
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

        logger.LogInformation("ScannerWorker iniciado. Intervalo: {Minutes} minutos", options.Value.IntervalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            statusService.ClearScanRequest();
            await RunScanAsync(stoppingToken);

            var elapsed = TimeSpan.Zero;
            var interval = TimeSpan.FromMinutes(options.Value.IntervalMinutes);
            while (elapsed < interval && !stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                elapsed += TimeSpan.FromSeconds(5);
                if (statusService.IsScanRequested) break;
            }
        }
    }

    private async Task RunScanAsync(CancellationToken cancellationToken)
    {
        statusService.SetRunning(true);
        logger.LogInformation("Iniciando escaneo de medios...");

        try
        {
            using var scope = scopeFactory.CreateScope();
            var scanner = scope.ServiceProvider.GetRequiredService<IMediaScannerService>();
            var count = await scanner.ScanAsync(cancellationToken);
            statusService.SetCompleted(count);
            logger.LogInformation("Escaneo completado. {Count} elementos procesados", count);
        }
        catch (OperationCanceledException)
        {
            statusService.SetFailed("Cancelado");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error durante el escaneo de medios");
            statusService.SetFailed(ex.Message);
        }
    }
}

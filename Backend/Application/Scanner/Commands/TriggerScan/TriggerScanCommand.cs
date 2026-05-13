using MediatR;

namespace Application.Scanner.Commands.TriggerScan;

/// <summary>
/// Solicita un escaneo manual. Si <paramref name="Force"/> = true, también
/// fuerza el reseteo del TTL de refresco (180 días) bajando <c>UpdatedAt</c>
/// en todas las tablas, lo que hace que el siguiente escaneo refresque TODO
/// (útil para backfills cuando se añade un campo nuevo desde TMDB).
/// </summary>
public sealed record TriggerScanCommand(bool Force = false) : IRequest;

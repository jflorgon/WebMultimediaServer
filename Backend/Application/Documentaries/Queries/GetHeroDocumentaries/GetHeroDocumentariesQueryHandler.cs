using Application.Common.Interfaces;
using AutoMapper;
using Contracts.Documentaries;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SeriesEntity = Domain.Entities.Series;

namespace Application.Documentaries.Queries.GetHeroDocumentaries;

public sealed class GetHeroDocumentariesQueryHandler(IApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetHeroDocumentariesQuery, IReadOnlyList<DocumentaryListItemDto>>
{
    public async Task<IReadOnlyList<DocumentaryListItemDto>> Handle(GetHeroDocumentariesQuery request, CancellationToken cancellationToken)
    {
        // Los documentales viven en dos tablas (Documentaries puro y Series con Kind=Documentary).
        // Pedimos hasta Count de cada fuente con el filtro de rating, los combinamos y barajamos.
        var docsPrimary = await db.Documentaries.AsNoTracking()
            .Where(d => d.Rating != null && d.Rating >= request.MinRating)
            .OrderBy(_ => Guid.NewGuid())
            .Take(request.Count)
            .ToListAsync(cancellationToken);

        var seriesPrimary = await db.Series.AsNoTracking()
            .Where(s => s.Kind == SeriesKind.Documentary && s.Rating != null && s.Rating >= request.MinRating)
            .OrderBy(_ => Guid.NewGuid())
            .Take(request.Count)
            .ToListAsync(cancellationToken);

        var primary = MapAndShuffle(docsPrimary, seriesPrimary).Take(request.Count).ToList();

        if (primary.Count < request.Count)
        {
            var needed = request.Count - primary.Count;
            var pickedIds = primary.Select(p => p.Id).ToList();

            var docsFallback = await db.Documentaries.AsNoTracking()
                .Where(d => !pickedIds.Contains(d.Id))
                .OrderBy(_ => Guid.NewGuid())
                .Take(needed)
                .ToListAsync(cancellationToken);

            var seriesFallback = await db.Series.AsNoTracking()
                .Where(s => s.Kind == SeriesKind.Documentary && !pickedIds.Contains(s.Id))
                .OrderBy(_ => Guid.NewGuid())
                .Take(needed)
                .ToListAsync(cancellationToken);

            primary.AddRange(MapAndShuffle(docsFallback, seriesFallback).Take(needed));
        }

        return primary;
    }

    private IEnumerable<DocumentaryListItemDto> MapAndShuffle(IEnumerable<Documentary> docs, IEnumerable<SeriesEntity> series)
    {
        var rng = Random.Shared;
        return docs.Select(d => mapper.Map<DocumentaryListItemDto>(d))
            .Concat(series.Select(s => mapper.Map<DocumentaryListItemDto>(s)))
            .OrderBy(_ => rng.Next());
    }
}

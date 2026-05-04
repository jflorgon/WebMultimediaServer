using Application.Common.Interfaces;
using AutoMapper;
using Contracts.Documentaries;
using Core.Pagination;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Documentaries.Queries.GetDocumentaries;

public sealed class GetDocumentariesQueryHandler(IApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetDocumentariesQuery, PagedResult<DocumentaryListItemDto>>
{
    public async Task<PagedResult<DocumentaryListItemDto>> Handle(GetDocumentariesQuery request, CancellationToken cancellationToken)
    {
        var docsQuery = db.Documentaries.AsNoTracking().AsQueryable();
        var seriesDocsQuery = db.Series.AsNoTracking().Where(s => s.Kind == SeriesKind.Documentary);

        if (!string.IsNullOrWhiteSpace(request.Title))
        {
            var t = request.Title.ToLower();
            docsQuery = docsQuery.Where(d => d.Title.ToLower().Contains(t));
            seriesDocsQuery = seriesDocsQuery.Where(s => s.Title.ToLower().Contains(t));
        }

        if (request.Year.HasValue)
        {
            docsQuery = docsQuery.Where(d => d.Year == request.Year);
            seriesDocsQuery = seriesDocsQuery.Where(s => s.Year == request.Year);
        }

        if (!string.IsNullOrWhiteSpace(request.Genre))
        {
            docsQuery = docsQuery.Where(d => d.Genres.Contains(request.Genre));
            seriesDocsQuery = seriesDocsQuery.Where(s => s.Genres.Contains(request.Genre));
        }

        var docs = await docsQuery.ToListAsync(cancellationToken);
        var seriesDocs = await seriesDocsQuery.ToListAsync(cancellationToken);

        // Unión + orden + paginación en memoria. Aceptable: catálogo personal,
        // no escala a miles de documentales.
        var combined = docs
            .Select(d => (CreatedAt: d.CreatedAt, Dto: mapper.Map<DocumentaryListItemDto>(d)))
            .Concat(seriesDocs.Select(s => (CreatedAt: s.CreatedAt, Dto: mapper.Map<DocumentaryListItemDto>(s))))
            .OrderByDescending(x => x.CreatedAt)
            .ToList();

        var totalCount = combined.Count;
        var items = combined
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => x.Dto)
            .ToList();

        return new PagedResult<DocumentaryListItemDto>(items, totalCount, request.Page, request.PageSize);
    }
}

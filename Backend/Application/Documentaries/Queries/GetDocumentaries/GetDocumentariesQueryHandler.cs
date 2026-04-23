using Application.Common.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Contracts.Documentaries;
using Core.Pagination;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Documentaries.Queries.GetDocumentaries;

public sealed class GetDocumentariesQueryHandler(IApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetDocumentariesQuery, PagedResult<DocumentaryListItemDto>>
{
    public async Task<PagedResult<DocumentaryListItemDto>> Handle(GetDocumentariesQuery request, CancellationToken cancellationToken)
    {
        var query = db.Documentaries.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Title))
            query = query.Where(d => d.Title.ToLower().Contains(request.Title.ToLower()));

        if (request.Year.HasValue)
            query = query.Where(d => d.Year == request.Year);

        if (!string.IsNullOrWhiteSpace(request.Genre))
            query = query.Where(d => d.Genres.Contains(request.Genre));

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<DocumentaryListItemDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return new PagedResult<DocumentaryListItemDto>(items, totalCount, request.Page, request.PageSize);
    }
}

using Application.Common.Interfaces;
using AutoMapper;
using Contracts.Documentaries;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Documentaries.Queries.GetDocumentaryById;

public sealed class GetDocumentaryByIdQueryHandler(IApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetDocumentaryByIdQuery, DocumentaryDto?>
{
    public async Task<DocumentaryDto?> Handle(GetDocumentaryByIdQuery request, CancellationToken cancellationToken)
    {
        var doc = await db.Documentaries
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        return doc is null ? null : mapper.Map<DocumentaryDto>(doc);
    }
}

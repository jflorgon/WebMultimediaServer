using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Documentaries.Queries.GetDocumentaryGenres;

public sealed class GetDocumentaryGenresQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetDocumentaryGenresQuery, IReadOnlyList<string>>
{
    public async Task<IReadOnlyList<string>> Handle(GetDocumentaryGenresQuery request, CancellationToken cancellationToken)
    {
        return await db.Documentaries.AsNoTracking()
            .SelectMany(d => d.Genres)
            .Distinct()
            .OrderBy(g => g)
            .ToListAsync(cancellationToken);
    }
}

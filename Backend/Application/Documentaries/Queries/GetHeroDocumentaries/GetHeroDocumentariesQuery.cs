using Contracts.Documentaries;
using MediatR;

namespace Application.Documentaries.Queries.GetHeroDocumentaries;

public sealed record GetHeroDocumentariesQuery(int Count, double MinRating)
    : IRequest<IReadOnlyList<DocumentaryListItemDto>>;

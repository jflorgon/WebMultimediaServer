using Contracts.Documentaries;
using Core.Pagination;
using MediatR;

namespace Application.Documentaries.Queries.GetDocumentaries;

public sealed record GetDocumentariesQuery(
    string? Title,
    string? Genre,
    int? Year,
    int Page = 1,
    int PageSize = 20) : IRequest<PagedResult<DocumentaryListItemDto>>;

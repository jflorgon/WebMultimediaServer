using Contracts.Documentaries;
using MediatR;

namespace Application.Documentaries.Queries.GetDocumentaryById;

public sealed record GetDocumentaryByIdQuery(Guid Id) : IRequest<DocumentaryDto?>;

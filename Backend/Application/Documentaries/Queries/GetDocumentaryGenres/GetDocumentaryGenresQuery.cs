using MediatR;

namespace Application.Documentaries.Queries.GetDocumentaryGenres;

public sealed record GetDocumentaryGenresQuery() : IRequest<IReadOnlyList<string>>;

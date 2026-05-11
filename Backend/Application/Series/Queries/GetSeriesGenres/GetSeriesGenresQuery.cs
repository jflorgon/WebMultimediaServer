using MediatR;

namespace Application.Series.Queries.GetSeriesGenres;

public sealed record GetSeriesGenresQuery() : IRequest<IReadOnlyList<string>>;

using FluentValidation;

namespace Application.Movies.Queries.GetHeroMovies;

public sealed class GetHeroMoviesQueryValidator : AbstractValidator<GetHeroMoviesQuery>
{
    public GetHeroMoviesQueryValidator()
    {
        RuleFor(x => x.Count).InclusiveBetween(1, 50);
        RuleFor(x => x.MinRating).InclusiveBetween(0.0, 10.0);
    }
}

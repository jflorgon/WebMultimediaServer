using FluentValidation;

namespace Application.Series.Queries.GetHeroSeries;

public sealed class GetHeroSeriesQueryValidator : AbstractValidator<GetHeroSeriesQuery>
{
    public GetHeroSeriesQueryValidator()
    {
        RuleFor(x => x.Count).InclusiveBetween(1, 50);
        RuleFor(x => x.MinRating).InclusiveBetween(0.0, 10.0);
    }
}

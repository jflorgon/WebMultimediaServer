using FluentValidation;

namespace Application.Documentaries.Queries.GetHeroDocumentaries;

public sealed class GetHeroDocumentariesQueryValidator : AbstractValidator<GetHeroDocumentariesQuery>
{
    public GetHeroDocumentariesQueryValidator()
    {
        RuleFor(x => x.Count).InclusiveBetween(1, 50);
        RuleFor(x => x.MinRating).InclusiveBetween(0.0, 10.0);
    }
}

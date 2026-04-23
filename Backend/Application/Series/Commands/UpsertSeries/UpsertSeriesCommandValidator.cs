using FluentValidation;

namespace Application.Series.Commands.UpsertSeries;

public sealed class UpsertSeriesCommandValidator : AbstractValidator<UpsertSeriesCommand>
{
    public UpsertSeriesCommandValidator()
    {
        RuleFor(x => x.FilePath)
            .NotEmpty()
            .MaximumLength(1000);

        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(500);

        RuleFor(x => x.OriginalTitle)
            .MaximumLength(500)
            .When(x => x.OriginalTitle is not null);

        RuleFor(x => x.Year)
            .InclusiveBetween(1888, DateTime.UtcNow.Year + 2)
            .When(x => x.Year is not null);

        RuleFor(x => x.PosterUrl)
            .MaximumLength(500)
            .When(x => x.PosterUrl is not null);

        RuleFor(x => x.BackdropUrl)
            .MaximumLength(500)
            .When(x => x.BackdropUrl is not null);

        RuleFor(x => x.Overview)
            .MaximumLength(5000)
            .When(x => x.Overview is not null);

        RuleForEach(x => x.Genres)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Rating)
            .InclusiveBetween(0.0, 10.0)
            .When(x => x.Rating is not null);

        RuleFor(x => x.Seasons)
            .GreaterThan(0);

        RuleFor(x => x.Episodes)
            .GreaterThan(0);

        RuleFor(x => x.TmdbId)
            .GreaterThan(0)
            .When(x => x.TmdbId is not null);
    }
}

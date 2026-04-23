using FluentValidation;

namespace Application.Series.Commands.UpsertEpisode;

public sealed class UpsertEpisodeCommandValidator : AbstractValidator<UpsertEpisodeCommand>
{
    public UpsertEpisodeCommandValidator()
    {
        RuleFor(x => x.SeriesId).NotEmpty();
        RuleFor(x => x.SeasonNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.EpisodeNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500);
        RuleFor(x => x.FilePath).NotEmpty().MaximumLength(1000);
    }
}

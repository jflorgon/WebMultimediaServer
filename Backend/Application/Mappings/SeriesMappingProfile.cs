using AutoMapper;
using Contracts.Series;
using EpisodeEntity = Domain.Entities.Episode;
using SeriesEntity = Domain.Entities.Series;

namespace Application.Mappings;

public sealed class SeriesMappingProfile : Profile
{
    public SeriesMappingProfile()
    {
        CreateMap<SeriesEntity, SeriesDto>()
            .ForMember(d => d.EpisodeFiles, o => o.MapFrom(s => s.EpisodeFiles));
        CreateMap<SeriesEntity, SeriesListItemDto>();
        CreateMap<EpisodeEntity, EpisodeListItemDto>();
    }
}

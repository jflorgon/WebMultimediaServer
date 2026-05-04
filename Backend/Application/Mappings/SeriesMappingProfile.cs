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
            .ForMember(d => d.EpisodeFiles, o => o.MapFrom(s => s.EpisodeFiles))
            .ForMember(d => d.Kind, o => o.MapFrom(s => s.Kind.ToString()));
        CreateMap<SeriesEntity, SeriesListItemDto>()
            .ForMember(d => d.Kind, o => o.MapFrom(s => s.Kind.ToString()));
        CreateMap<EpisodeEntity, EpisodeListItemDto>();
    }
}

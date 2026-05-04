using AutoMapper;
using Contracts.Documentaries;
using Domain.Entities;
using SeriesEntity = Domain.Entities.Series;

namespace Application.Mappings;

public sealed class DocumentaryMappingProfile : Profile
{
    public DocumentaryMappingProfile()
    {
        CreateMap<Documentary, DocumentaryDto>();
        CreateMap<Documentary, DocumentaryListItemDto>()
            .ForMember(d => d.IsSeries, o => o.MapFrom(_ => false));
        // Doc-serie = entidad Series con Kind=Documentary → se proyecta también
        // como DocumentaryListItemDto para el listado unificado en /documentaries.
        CreateMap<SeriesEntity, DocumentaryListItemDto>()
            .ForMember(d => d.Genres, o => o.MapFrom(s => s.Genres))
            .ForMember(d => d.IsSeries, o => o.MapFrom(_ => true));
    }
}

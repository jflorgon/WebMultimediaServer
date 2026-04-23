using AutoMapper;
using Contracts.Documentaries;
using Domain.Entities;

namespace Application.Mappings;

public sealed class DocumentaryMappingProfile : Profile
{
    public DocumentaryMappingProfile()
    {
        CreateMap<Documentary, DocumentaryDto>();
        CreateMap<Documentary, DocumentaryListItemDto>();
    }
}

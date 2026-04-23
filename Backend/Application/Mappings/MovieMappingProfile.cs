using AutoMapper;
using Contracts.Movies;
using Domain.Entities;

namespace Application.Mappings;

public sealed class MovieMappingProfile : Profile
{
    public MovieMappingProfile()
    {
        CreateMap<Movie, MovieDto>();
        CreateMap<Movie, MovieListItemDto>();
    }
}

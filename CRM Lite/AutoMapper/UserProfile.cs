using AutoMapper;
using CRM_Lite.Data.Dtos;
using CRM_Lite.Data.Models;

namespace CRM_Lite.AutoMapper
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<UserDto, User>()
                .ReverseMap();
        }
    }
}
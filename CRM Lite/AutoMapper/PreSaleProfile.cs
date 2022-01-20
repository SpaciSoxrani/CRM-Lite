using System.Linq;
using AutoMapper;
using CRM.Data.Dtos.PreSale;
using CRM.Data.Models.PreSale;


namespace CRM.API.AutoMapper
{
    public class PreSaleProfile : Profile
    {
        public PreSaleProfile()
        {
            CreateMap<PreSaleGroupStatus, PreSaleGroupStatusDto>()
                .ReverseMap();

            CreateMap<PreSale, PreSaleDto>()
                .ForMember(ps => ps.ResponsibleUser, ps => ps.MapFrom(ps => ps.ResponsibleUser == null ? "" : ps.ResponsibleUser.DisplayName))
                .ForMember(ps => ps.Status, ps => ps.MapFrom(ps => ps.Status == null ? "" : ps.Status.Name))
                .ForMember(ps => ps.Result, ps => ps.MapFrom(ps => ps.Result == null ? "" : ps.Result.Name))
                .ForMember(ps => ps.Region, ps => ps.MapFrom(ps => ps.Region == null ? "" : ps.Region.Name))
                .ForMember(ps => ps.Timezone, ps => ps.MapFrom(ps => ps.Region == null ? "" : ps.Region.Timezone))
                .ForMember(ps => ps.Group, ps => ps.MapFrom(ps => ps.Group == null ? "" : ps.Group.Name))
                .ReverseMap();

            CreateMap<PreSaleGroup, PreSaleGroupDto>()
                .ForMember(psg => psg.Status, psg => psg.MapFrom(psg => psg.Status == null ? "" : psg.Status.Name))
                .ForMember(psg => psg.Department, psg => psg.MapFrom(psg => psg.Department == null ? "" : psg.Department.Name))
                .ReverseMap();



            CreateMap<PreSaleGroupAccessList, PreSaleGroupAccessListDto>()
                .ForMember(psgal => psgal.User, psgal => psgal.MapFrom(psgal => psgal.User == null ? "" : psgal.User.DisplayName))
                .ReverseMap();

            CreateMap<PreSaleStatus, PreSaleStatusDto>()
                .ReverseMap();

            CreateMap<PreSaleResult, PreSaleResultDto>()
                .ReverseMap();

            CreateMap<PreSaleRegion, PreSaleRegionDto>()
                .ReverseMap();
        }
    }
}

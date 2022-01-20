using System;
using System.Threading.Tasks;
using AutoMapper;
using CRM.Data;
using CRM.Data.Dtos.UserSettings;
using CRM.Data.Models.UserSettings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserSettingsController : ControllerBase
    {
        private readonly ApplicationContext applicationContext;
        private readonly IMapper mapper;

        public UserSettingsController(ApplicationContext context, IMapper mapper)
        {
            applicationContext = context;
            this.mapper = mapper;
        }

        [HttpPut("EmailSettings")]
        public async Task<IActionResult> EditEmailSettings(UserEmailSettingsDto userEmailSettingsDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userEmailSettings = mapper.Map<UserEmailManagement>(userEmailSettingsDto);

            applicationContext.Entry(userEmailSettings).State = EntityState.Modified;

            await applicationContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("EmailSettings")]
        public async Task<UserEmailSettingsDto> EmailSettings(Guid userId)
        {
            var userEmailSettings = await applicationContext.UserEmailManagements.SingleOrDefaultAsync(u => u.UserId == userId);

            var userEmailSettingsDto = mapper.Map<UserEmailSettingsDto>(userEmailSettings);

            return userEmailSettingsDto;
        }
    }
}
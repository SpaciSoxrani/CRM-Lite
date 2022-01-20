using System.Linq;
using System.Threading.Tasks;
using CRM.Data;
using CRM.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vostok.Logging.Abstractions;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/MigrationHelper")]
    [Authorize]
    public class MigrationHelperController : Controller
    {
        private readonly ApplicationContext applicationContext;
        private readonly ILog log;

        public MigrationHelperController(ApplicationContext applicationContext, ILog log)
        {
            this.applicationContext = applicationContext;
            this.log = log;
        }

        [HttpGet("AddEngineerRole")]
        public async Task<IActionResult> AddEngineerRole()
        {
            var engineerRole = new Role
            {
                Name = "Инженер-сметчик"
            };

            await applicationContext.Roles.AddAsync(engineerRole);

            await applicationContext.SaveChangesAsync();

            return Ok($"Роль инженера-сметчика добавлена");
        }

        //[HttpGet("AddChatGroupsFromProductRequests")]
        //public async Task<IActionResult> AddChatGroupsFromProductRequests()
        //{
        //    var requests = _context.ProductRequests.Select(r => new { r.Id, r.Name });

        //    foreach (var request in requests)
        //    {
        //        var chatGroup = new Group { RequestId = request.Id, GroupName = request.Name };
        //        await _context.Groups.AddAsync(chatGroup);
        //    }

        //    await _context.SaveChangesAsync();

        //    return Ok("Chat Groups Added");
        //}
    }
}
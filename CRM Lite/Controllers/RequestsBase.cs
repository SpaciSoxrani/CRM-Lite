using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CRM.API.Utilities;
using CRM.Data;
using CRM.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    public class RequestsBase : Controller
    {
        protected readonly ApplicationContext ApplicationContext;
        protected readonly UserManager UserManager;
        
        protected readonly HashSet<string> FullAccessRoleNames = new HashSet<string>
        {
            "Администратор",
            "TOP-менеджер",
            "Менеджер по СМК"
        };

        public RequestsBase(ApplicationContext applicationContext, UserManager userManager)
        {
            this.ApplicationContext = applicationContext;
            this.UserManager = userManager;
        }
        
        [NonAction]
        protected async Task<IActionResult> MakeInvisible<TRequest, TOldRequest>([FromRoute] Guid id)
        where TRequest : class, IRequest
        where TOldRequest : class, IOldRequest
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var servicesRequest = await ApplicationContext.Set<TRequest>()
                .Include(d => d.Deal)
                .ThenInclude(d => d.ResponsibleUser)
                .SingleOrDefaultAsync(m => m.Id == id);

            var oldServiceRequest = await ApplicationContext.Set<TOldRequest>().SingleOrDefaultAsync(m => m.Id == id);

            if (servicesRequest == null)
            {
                if (oldServiceRequest == null)
                {
                    return NotFound();
                }

                oldServiceRequest.IsVisible = false;
            }
            else
            {
                var user = await UserManager.GetCurrentUserAsync();

                if (!user.UserRoles.Any(ur => FullAccessRoleNames.Contains(ur.Role.Name)) &&
                    servicesRequest.Deal?.ResponsibleUserId != user.Id &&
                    servicesRequest.Deal?.ResponsibleUser?.ManagerId != user.Id)
                    return StatusCode(403);

                servicesRequest.IsVisible = false;
            }

            await ApplicationContext.SaveChangesAsync();

            return Ok(servicesRequest);
        }
    }
}
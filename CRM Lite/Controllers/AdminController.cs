using System;
using System.Globalization;
using System.Threading.Tasks;
using CRM.API.Utilities;
using CRM.Data;
using CRM.Data.Models;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/Admin")]
    [Authorize]
    public class AdminController : Controller
    {
        private readonly ApplicationContext context;
        private readonly IAccessManager accessManager;
        private readonly IBackgroundJobClient backgroundJob;
        private readonly UserManager userManager;

        public AdminController(ApplicationContext context, IAccessManager accessManager, IBackgroundJobClient backgroundJob, UserManager userManager)
        {
            this.context = context;
            this.accessManager = accessManager;
            this.backgroundJob = backgroundJob;
            this.userManager = userManager;
        }

        [AllowAnonymous]
        [HttpGet("Status")]
        public async Task<ActionResult> Status()
        {
            try
            {
                //TODO(dstarasov): при каждом обращении к этому GET методу будет происходить что-то с БД, GET не предназначен для такого
                await context.Database.EnsureCreatedAsync();
            }
            catch (Exception e)
            {
                //TODO(dstarasov): anonymous type
                return Json(new {e.Message, e.InnerException});
            }

            return Ok("Ok");
        }

        [AllowAnonymous]
        [HttpGet("HostTime")]
        public async Task<ActionResult> HostTime()
        {
            var res = $"CurrentCulture:{CultureInfo.CurrentCulture.Name}, CurrentUICulture:{CultureInfo.CurrentUICulture.Name}, Time: {DateTime.Now.ToShortDateString()}";
            return Json(res);
        }

        [HttpPost]
        [Route("~/api/ToogleUserRole")]
        public async Task<IActionResult> ToogleUserRole(Guid userId, Guid roleId)
        {
            var employeeRoleEntry = new UserRole {RoleId = roleId, UserId = userId};

            if (!await context.UserRoles.AnyAsync(ur => ur.RoleId == roleId && ur.UserId == userId))
            {
                await context.AddAsync(employeeRoleEntry);
            }
            else
            {
                context.UserRoles.Remove(employeeRoleEntry);
            }

            await context.SaveChangesAsync();

            backgroundJob.Enqueue(() => accessManager.UpdateAccessForUserAsync(userId));

            return Ok();
        }

        [HttpGet]
        [Route("~/api/check")]
        public string Check()
        {
            try
            {
                return userManager.GetCurrentUserLogin() ?? "null";
            }
            catch (Exception e)
            {
                //TODO(dstarasov): не самая хорошая практика показывать StackTrace'ы
                return "error: " + e.Message + "\nstacktrace: " + e.StackTrace;
            }
        }
    }
}
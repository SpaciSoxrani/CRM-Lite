using System;
using System.Linq;
using System.Threading.Tasks;
using CRM_Lite.Data;
using CRM_Lite.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM_Lite.Controllers
{
    [Produces("application/json")]
    [Route("[controller]")]
    public class DepartmentsController : Controller
    {
        private readonly ApplicationContext _context;

        public DepartmentsController(ApplicationContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<Department[]>> GetDepartmentsAsync()
        {
            return await _context.Departments.ToArrayAsync();
        }

        [HttpGet("MainDepartments")]
        public async Task<ActionResult<Guid>> MainDepartments()
        {
            return Json(await _context.Departments.Where(e => e.ParentDepartment == null).Select(e => new
            {
                e.Name,
                e.Id
            }).ToListAsync());
        }
    }
}
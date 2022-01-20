using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CRM.API.Utilities;
using CRM.Data;
using CRM.Data.Models;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/Departments")]
    [Authorize]
    public class DepartmentsController : Controller
    {
        private readonly ApplicationContext context;
        private readonly IAccessManager accessManager;
        private readonly IBackgroundJobClient backgroundJob;

        public DepartmentsController(ApplicationContext context, IAccessManager accessManager, IBackgroundJobClient backgroundJob)
        {
            this.context = context;
            this.accessManager = accessManager;
            this.backgroundJob = backgroundJob;
        }

        [HttpGet]
        public async Task<ActionResult<Department[]>> GetDepartmentsAsync()
        {
            return await context.Departments.ToArrayAsync();
        }

        [HttpGet("GetSalesDepartment")]
        public async Task<ActionResult<Guid>> GetSalesDepartment()
        {
            return Json(context.Departments
                .Where(d => d.IsActive && d.CanSell && d.ParentDepartment != null)
                .Select(
                    //TODO(dstarasov): anonymous type
                    e => new
                {
                    e.Id,
                    e.Name
                }).ToList());
        }

        [HttpGet("MainDepartments")]
        public async Task<ActionResult<Guid>> MainDepartments()
        {
            return Json(await context.Departments.Where(e => e.ParentDepartment == null).Select(e => new
            {
                e.Name,
                e.Id
            }).ToListAsync());
        }

        [HttpGet("GetDepartmentIdByUserId")]
		public async Task<ActionResult<Guid>> DepartmentsForList(Guid saleId)
		{
			var sale = await context.Users.SingleOrDefaultAsync(u => u.Id == saleId);			

			return sale.DepartmentId;
		}

		[HttpGet]
		[Route("~/api/DepartmentsForList")]
        //TODO(dstarasov): JsonResult не подходящий тип для контракта API
        public async Task<JsonResult> DepartmentsForList()
        {
            var users = await context.Users.ToListAsync();

            var depList = await context.Departments.ToListAsync();
            var deps = new List<DepartmentData>();
            foreach (var department in depList)
            {
                //TODO(dstarasov): линейный поиск в коллекции в цикле o(n^2), нужно переделать хотя бы на линию
                //для этого нужно проиндексировать всех пользователей в Hash-таблицу (Dictionary<>) и поиск менеджера уже делать
                //за константу через этот словарь

                var manager = users.SingleOrDefault(r => r.Id == department.ManagerFromAD);
                var managerName = manager == null ? "" : manager.DisplayName;

                deps.Add(
                    new DepartmentData
                    {
                        Id = department.Id,
                        Name = department.Name,
                        ManagerName = managerName
                    });
            }

            return Json(deps);
		}

        [HttpGet]
        [Route("~/api/GetDepartmentsForCreatingOrganization")]
        //TODO(dstarasov): JsonResult не подходящий тип для контракта API
        public JsonResult GetDepartmentsForCreatingOrganization()
        {
            return Json(context.Departments
                .Include(d => d.ParentDepartment)
                .Where(d => d.IsActive &&
                            (d.ParentDepartmentId == null || d.ParentDepartment.Name == "ДИС" && d.Name.Contains("продаж")) && 
                            d.Name != "ДИС")
                .Select(e => new
                {
                    e.Id,
                    e.Name
                }).ToList());
        }

        [HttpGet]
		[Route("~/api/GetActiveDepartments")]
        //TODO(dstarasov): JsonResult не подходящий тип для контракта API
        public JsonResult GetActiveDepartments()
		{
			return Json(context.Departments
				  .Where(d => d.IsActive && d.ParentDepartmentId == null)
				  .Select(e => new
				  {
					  e.Id,
					  e.Name
				  }).ToList());
		}

        [HttpGet("ActiveDepartmentsForCreatingOrganization")]
        //TODO(dstarasov): JsonResult не подходящий тип для контракта API
        public JsonResult GetActiveDepartmentsForCreatingOrganization()
        {
            return Json(context.Departments
                .Include(d => d.ParentDepartment)
                  .Where(d => d.Name != "ДИС" && d.IsActive && (d.ParentDepartmentId == null || d.ParentDepartment.Name == "ДИС" && d.CanSell))
                  .Select(e => new
                  {
                      e.Id,
                      e.Name
                  }).ToList());
        }


        [HttpGet]
		[Route("~/api/GetIndustrialUnitsByParentDepartmentId/{id}")]
        //TODO(dstarasov): JsonResult не подходящий тип для контракта API
        public JsonResult GetIndustrialUnitsByParentDepartmentId([FromRoute] Guid id)
		{
            return Json(
                //TODO(dstarasov): synchronous IO
                context.Departments
                    .Where(d => d.IsActive && d.ParentDepartmentId == id && (d.CanExecute || d.CanProduct))
                    .Select(
                        // TODO(dstarasov): anonymous type
                        e => new
                        {
                            e.CanExecute,
                            e.CanProduct,
                            e.Id,
                            e.Name
                        })
                    .ToList());
        }

        [HttpGet]
        [Route("~/api/GetIndustrialUnitsByParentDepartmentIdForService/{id}")]
        //TODO(dstarasov): JsonResult не подходящий тип для контракта API
        public JsonResult GetIndustrialUnitsByParentDepartmentIdForService([FromRoute] Guid id)
        {
            return Json(
                //TODO(dstarasov): synchronous IO
                context.Departments
                    .Where(
                        d => d.IsActive &&
                             d.ParentDepartmentId == id &&
                             (d.CanExecute || d.CanProduct ||
                              d.Name.Contains("Проектный")))
                    .Select(
                        // TODO(dstarasov): anonymous type
                        e => new
                        {
                            e.CanExecute,
                            e.CanProduct,
                            e.Id,
                            e.Name
                        })
                    .ToList());
        }

        [HttpGet]
        [Route("~/api/GetProductAndSalesUnitsByParentDepartmentId/{id}")]
        //TODO(dstarasov): JsonResult не подходящий тип для контракта API
        public JsonResult GetProductAndSalesUnitsByParentDepartmentId([FromRoute] Guid id)
        {
            return Json(
                //TODO(dstarasov): synchronous IO
                context.Departments
                    .Where(d => d.IsActive && d.ParentDepartmentId == id && (d.CanSell || d.CanProduct))
                    .Select(
                        // TODO(dstarasov): anonymous type
                        e => new
                        {
                            e.Id,
                            e.Name,
                            e.CanSell,
                            e.CanProduct
                        })
                    .ToList());
        }

        // GET: api/Departments/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDepartment([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)            
                return BadRequest(ModelState);            

            var department = await context.Departments.SingleOrDefaultAsync(m => m.Id == id);

            if (department == null)           
                return NotFound();            

            return Ok(department);
        }
        
        // PUT: api/Departments/5
        [HttpPut("{id}/{userId}")]
        public async Task<IActionResult> PutDepartment([FromRoute] Guid id, [FromRoute] Guid userId, [FromBody] Department department)
        {
            if (!ModelState.IsValid)            
                return BadRequest(ModelState);            

            if (id != department.Id)            
                return BadRequest();
            
            context.Entry(department).State = EntityState.Modified;

			try
			{
				await context.SaveChangesAsync();

                if(department.ManagerId != null)
                    backgroundJob.Enqueue(() => accessManager.UpdateAccessForUserAsync((Guid)department.ManagerId));
            }
			catch (DbUpdateConcurrencyException)
            {
                if (!DepartmentExists(id))
					return NotFound();

                throw;
            }            

            return NoContent();
        }

        // POST: api/Departments
        [HttpPost]
        public async Task<IActionResult> PostDepartment([FromBody] Department department)
        {
            if (!ModelState.IsValid)            
                return BadRequest(ModelState);            

            context.Departments.Add(department);
            await context.SaveChangesAsync();

            return CreatedAtAction("GetDepartment", new { id = department.Id }, department);
        }

        // DELETE: api/Departments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)            
                return BadRequest(ModelState);
            

            var department = await context.Departments.SingleOrDefaultAsync(m => m.Id == id);
            if (department == null)            
                return NotFound();
            

            context.Departments.Remove(department);
            await context.SaveChangesAsync();

            return Ok(department);
        }

        private bool DepartmentExists(Guid id)
        {
            return context.Departments.Any(e => e.Id == id);
        }

		private class DepartmentData
		{
			public Guid Id { get; set; }
			public string Name { get; set; }
			public string ManagerName { get; set; }
		}
	}
}
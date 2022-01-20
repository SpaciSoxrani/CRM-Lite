using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.API.Utilities;
using CRM.Data;
using CRM.Data.AuxiliaryModels;
using CRM.Data.Dtos.ProductLines;
using CRM.Data.Models.Lookup;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace CRM.API.Controllers
{
	[Produces("application/json")]
	[Route("api/ProductLines")]
    [Authorize]
    public class ProductLinesController : Controller
    {
        private readonly ApplicationContext applicationContext;
        private readonly IAccessManager accessManager;
        private readonly IBackgroundJobClient backgroundJobClient;
        private readonly IMapper mapper;

        public ProductLinesController(ApplicationContext applicationContext, IAccessManager accessManager, IBackgroundJobClient backgroundJobClient, IMapper mapper)
        {
            this.applicationContext = applicationContext;
            this.accessManager = accessManager;
            this.backgroundJobClient = backgroundJobClient;
            this.mapper = mapper;
        }

        [HttpGet]
		public async Task<ActionResult<ProductLineShortDto[]>> GetLines()
        {
            var productLines = await applicationContext.ProductLines
                .ToArrayAsync();

            return mapper.Map<ProductLineShortDto[]>(productLines);
        }

		[HttpGet]
		[Route("~/api/LinesForList")]
		public JsonResult LinesForList()
		{
			return Json(applicationContext.ProductLines.Select(e => new
			{
				id = e.Id,
				name = e.Name,
				department = e.Department.Name,
			}).ToList());
		}

		[HttpGet]
		[Route("~/api/GetLinesByDepartmentId/{id}")]
		public JsonResult GetLinesByDepartmentId([FromRoute] Guid id)
		{
			return Json(applicationContext.ProductLines.Where(l => l.DepartmentId == id).Select(e => new
			{
				id = e.Id,
				name = e.Name,
				department = e.Department.Name,
				responsibleId = e.ResponsibleId
			}).ToList());
		}

		[HttpGet("{id}")]
		public async Task<ActionResult<ProductLines>> GetLine([FromRoute] Guid id)
		{
			if (!ModelState.IsValid)			
				return BadRequest(ModelState);			

			var line = await applicationContext.ProductLines.SingleOrDefaultAsync(m => m.Id == id);

			if (line == null)
				return NotFound();

			return line;
		}

		[HttpPost]
		public async Task<IActionResult> PostLine([FromBody] JObject data)
		{
            var line = new ProductLines
            {
                Name = (string) data.GetValue("name"),
                DepartmentId = (Guid) data.GetValue("departmentId")
            };


            applicationContext.Add(line);
			await applicationContext.SaveChangesAsync();

			return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = line.Id });
		}

		[HttpPut("{id}/{userId}")]
		public async Task<IActionResult> PutLine([FromRoute] Guid id, [FromRoute] Guid userId, [FromBody] ProductLines line)
		{
			if (!ModelState.IsValid)			
				return BadRequest(ModelState);
			

			if (id != line.Id)			
				return BadRequest();			

			applicationContext.Entry(line).State = EntityState.Modified;

			try
			{
				await applicationContext.SaveChangesAsync();

                if(line.ResponsibleId != null)
                    backgroundJobClient.Enqueue(() => accessManager.UpdateAccessForUserAsync((Guid)line.ResponsibleId));
            }
			catch (DbUpdateConcurrencyException)
			{
				if (!LineExists(id))				
					return NotFound();				
				else				
					throw;				
			}

			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> DeleteLine([FromRoute] Guid id)
		{
			var line = await applicationContext.ProductLines.FirstOrDefaultAsync(m => m.Id == id);

			applicationContext.ProductLines.Remove(line);
			await applicationContext.SaveChangesAsync();

			return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = line.Id });
		}

		private bool LineExists(Guid id)
		{
			return applicationContext.ProductLines.Any(e => e.Id == id);
		}
	}
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CRM.API.Utilities;
using CRM.Data;
using CRM.Data.AuxiliaryModels;
using CRM.Data.Models.Lookup;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;


namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/DealTypes")]
    [Authorize]
    public class DealTypesController : Controller
    {
        private readonly ApplicationContext _context;
        private readonly IAccessManager _accessManager;
        private readonly IBackgroundJobClient _backgroundJob;

        public DealTypesController(ApplicationContext context, IAccessManager accessManager, IBackgroundJobClient backgroundJob)
        {
            _context = context;
            _accessManager = accessManager;
            _backgroundJob = backgroundJob;
        }

        [HttpGet]
		[Route("~/api/TypesForList")]
		public JsonResult TypesForList()
		{
			return Json(_context.DealTypes.Select(e => new
			{
				id = e.Id,
				name = e.Name,
				department = e.Department.Name,
			}).ToList());
		}

		[HttpGet]
		[Route("~/api/GetTypesByDepartmentId/{id}")]
		public JsonResult GetTypesByDepartmentId([FromRoute] Guid id)
		{
			return Json(_context.DealTypes.Where(t => t.DepartmentId == id).Select(e => new
			{
				id = e.Id,
				name = e.Name,
				department = e.Department.Name,
			}).ToList());
		}

		[HttpGet]
        public IEnumerable<DealType> GetDealTypes()
        {
            return _context.DealTypes;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDealType([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)            
                return BadRequest(ModelState);            

            var value = await _context.DealTypes.SingleOrDefaultAsync(m => m.Id == id);

            if (value == null)            
                return NotFound();            

            return Ok(value);
        }

		[HttpPut("{id}/{userId}")]
		public async Task<IActionResult> PutType([FromRoute] Guid id, [FromRoute] Guid userId, [FromBody] DealType type)
		{
			if (!ModelState.IsValid)			
				return BadRequest(ModelState);			

			if (id != type.Id)			
				return BadRequest();			

			_context.Entry(type).State = EntityState.Modified;

			try
			{
				await _context.SaveChangesAsync();
            }
			catch (DbUpdateConcurrencyException)
			{
				if (!TypeExists(id))			
					return NotFound();				
				else				
					throw;				
			}

			return NoContent();
		}

		[HttpPost]
		public async Task<IActionResult> PostType([FromBody] JObject data)
		{
            var type = new DealType
            {
                Name = (string) data.GetValue("name"),
                DepartmentId = (Guid) data.GetValue("departmentId")
            };


            _context.Add(type);
			await _context.SaveChangesAsync();

			return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = type.Id });
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> DeleteType([FromRoute] Guid id)
		{
			var type = await _context.DealTypes.FirstOrDefaultAsync(m => m.Id == id);

			_context.DealTypes.Remove(type);
			await _context.SaveChangesAsync();

			return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = type.Id });
		}

		private bool TypeExists(Guid id)
		{
			return _context.DealTypes.Any(e => e.Id == id);
		}
	}
}
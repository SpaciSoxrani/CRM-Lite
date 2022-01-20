using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CRM.Data;
using CRM.Data.AuxiliaryModels;
using CRM.Data.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
	[Produces("application/json")]
	[Route("api/AttachementsLists")]
	public class AttachementsListsController : Controller
	{
		private readonly ApplicationContext _context;

		public AttachementsListsController(ApplicationContext context)
		{
			_context = context;
		}

		// GET: api/AttachementsLists
		[HttpGet]
		public IEnumerable<AttachementsList> GetAttachementsList()
		{
			return _context.AttachementsList;
		}

		// GET: api/AttachementsLists/5
		[HttpGet("{id}")]
		public async Task<IActionResult> GetAttachementsList([FromRoute] Guid id/*, [FromRoute] string FileType*/)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			var attachementsList = await _context.AttachementsList.SingleOrDefaultAsync(m => m.Id == id);

			if (attachementsList == null)
			{
				return NotFound();
			}

			return Ok(attachementsList);
		}

		// PUT: api/AttachementsLists/5
		[HttpPut("{id}")]
		public async Task<IActionResult> PutAttachementsList([FromRoute] Guid id, [FromBody] AttachementsList attachementsList)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			if (id != attachementsList.Id)
			{
				return BadRequest();
			}

			_context.Entry(attachementsList).State = EntityState.Modified;

			try
			{
				await _context.SaveChangesAsync();
			}
			catch (DbUpdateConcurrencyException)
			{
				if (!AttachementsListExists(id))
				{
					return NotFound();
				}
				else
				{
					throw;
				}
			}

			return NoContent();
		}

		// POST: api/AttachementsLists
		[HttpPost]
		public async Task<IActionResult> PostAttachementsList(IFormFile file/*, [FromBody] JObject fileName*/)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}
			//var name = (string)fileName.GetValue("verificationStepFileContestDocumentation");
			var attachementList = new AttachementsList();

			using (var binaryReader = new BinaryReader(file.OpenReadStream()))
			{
				attachementList.Report = binaryReader.ReadBytes((int)file.Length);
			}

			_context.AttachementsList.Add(attachementList);
			await _context.SaveChangesAsync();

			return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = attachementList.Id });
		}

	

		// DELETE: api/AttachementsLists/5
		[HttpDelete("{id}")]
		public async Task<IActionResult> DeleteAttachementsList([FromRoute] Guid id)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			var attachementsList = await _context.AttachementsList.SingleOrDefaultAsync(m => m.Id == id);
			if (attachementsList == null)
			{
				return NotFound();
			}

			_context.AttachementsList.Remove(attachementsList);
			await _context.SaveChangesAsync();

			return Ok(attachementsList);
		}

		private bool AttachementsListExists(Guid id)
		{
			return _context.AttachementsList.Any(e => e.Id == id);
		}
	}
}
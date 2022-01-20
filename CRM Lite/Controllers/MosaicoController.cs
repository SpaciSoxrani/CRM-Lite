using System.Collections.Generic;
using System.Threading.Tasks;
using CRM.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mosaico.NetCore.Models;
using Newtonsoft.Json.Linq;

namespace CRM.API.Controllers
{
	[Produces("application/json")]
	[Route("api/Mosaico")]
    [Authorize]
    public class MosaicoController
	{
		private readonly ApplicationContext context;

		public MosaicoController(ApplicationContext _context)
		{
			context = _context;
		}

		[HttpGet]
		public IEnumerable<MosaicoEmail> GetMosaicoEmail()
		{
			return context.MosaicoEmails;
		}

		[HttpGet("{id}")]
		public async Task<ActionResult<MosaicoEmail>> GetMosaicoEmail([FromRoute] int id)
		{		
			var mosaicoEmail = await context.MosaicoEmails.SingleOrDefaultAsync(m => m.Id == id);

			return mosaicoEmail;
		}

		[HttpPost]
		public async Task<bool> Save([FromBody] JObject data)
		{
			
			//try
			//{
			var id = (int)data.GetValue("id");
			var record = await context.MosaicoEmails.FindAsync(id);

			bool isNew = record == null;

			if (isNew)
			{
				record = new MosaicoEmail();
			}

			record.Name = (string)data.GetValue("name");
			record.Template = (MosaicoTemplate)(int)data.GetValue("template");
			record.Metadata = (string)data.GetValue("metadata");
			record.Content = (string)data.GetValue("content");
			// Save the HTML so we can use it for mass emailing. Example: User will input tokens like {FirstName}, {LastName}, etc into the template,
			//  then we can do a search and replace with regex when sending emails (Your own logic, somewhere in your app).
			record.Html = (string)data.GetValue("html");
	
			if (isNew)
			{
				await context.MosaicoEmails.AddAsync(record);
			}
			else
			{
				context.MosaicoEmails.Update(record);
			}

			await context.SaveChangesAsync();

			return false;
			//	return true;
			//	//	Ok(new { Success = true, Message = "Sucessfully saved email." });
			//}
			//catch (Exception x)
			//{
			//	return false;
			//	//	Json(new { Success = false, Message = x.GetBaseException().Message });
			//}
		}

		
	}
}

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using CRM.Data;
using CRM.Data.Dtos.Deals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Newtonsoft.Json.Linq;

namespace CRM.API.Controllers
{
	[Route("api/Survey")]
	[ApiController]
    [Authorize]
    public class SurveyController : Controller
	{
		// GET: api/Survey

		private readonly ApplicationContext applicationContext;
		private IWebHostEnvironment environment;
		public SurveyController(ApplicationContext context, IWebHostEnvironment environment)
		{
			applicationContext = context;
			this.environment = environment;
		}

		[AllowAnonymous]
		[HttpGet("{fileName}/{lineName}")]
		public ActionResult GetSurvey(string fileName, string lineName)
		{
			string path;
			try
			{
				path = Path.Combine(environment.WebRootPath, "surveys", lineName);
			}
			catch (Exception)
			{
				Response.StatusCode = 404;
				return Content("Ошибка пути");
			}
			var provider = new PhysicalFileProvider(path);
			var fileInfo = provider.GetFileInfo(fileName);
            var readStream = fileInfo.CreateReadStream();
            new FileExtensionContentTypeProvider().TryGetContentType(fileName, out var contentType);
			contentType ??= "application/octet-stream";
			return File(readStream, contentType, fileName);
		}
			
		// POST: api/Survey
		[HttpPost]
		public ActionResult GetData(Guid[] lines)
		{
            var pListName = new string[lines.Length];
			for (var i = 0; i < lines.Length; i++)
			{
				var name = applicationContext.ProductLines.SingleOrDefault(m => m.Id == lines[i])?.Name;

                if(!string.IsNullOrEmpty(name))
				    pListName[i] = name;
			}

			return GetSurveyName(pListName);
		}

		
		// PUT: api/Survey/5
		[HttpPut("{id}")]
		public void Put(int id, [FromBody] string value)
		{
		}

		// DELETE: api/ApiWithActions/5
		[HttpDelete("{id}")]
		public void Delete(int id)
		{
		}

		private ActionResult GetSurveyName(string[] pList)
		{
            var surveyDtoList = new List<SurveyDto>();

            for (var i = 0; i < pList.Length; i++)
            {
                var fullPath = Path.Combine(environment.WebRootPath,
                    "surveys", pList[i]).Replace('\"', ' ');

                if (!Directory.Exists(fullPath))
                    return StatusCode(StatusCodes.Status404NotFound);

                var dir = new DirectoryInfo(fullPath);

                foreach (var file in dir.GetFiles())
                {
                    surveyDtoList.Add(new SurveyDto {
                        FileName = file.Name,
                        LineName = pList[i]
                    });
                }
            }

            return Json(surveyDtoList);
        }

	
	}
}


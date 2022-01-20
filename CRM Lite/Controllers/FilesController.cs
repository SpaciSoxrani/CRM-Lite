using System;
using System.IO;
using System.Linq;
using CRM.Data;
using CRM.Data.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using CRM.API.Utilities;
using CRM.Data.Dtos.Deals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Vostok.Logging.Abstractions;

namespace CRM.API.Controllers
{
	[Produces("application/json")]
	[Route("api/File")]
    public class FilesController : Controller
	{
		private readonly ApplicationContext applicationContext;
		private IWebHostEnvironment environment;
        private readonly UserManager userManager;
        private readonly ILog log;

        public FilesController(ApplicationContext applicationContext, ILog log, UserManager userManager, IWebHostEnvironment environment)
		{
			this.applicationContext = applicationContext;
            this.environment = environment;
            this.userManager = userManager;
            this.log = log;
        }

        [HttpGet("GetOldFile/{dealId}/{fileName}")]
        [Authorize("DocumentServerCheckIP")]
        public IActionResult GetOldFile(Guid dealId, string fileName)
        {
            Deal deal;
            try
            {
                deal = applicationContext.Deals.FirstOrDefault(b => b.Id == dealId);

                if (deal == null)
                    return Content("Сделка не найдена");
            }
            catch (Exception e)
            {
                log.Error(e.InnerException);
                Response.StatusCode = 404;
                return Content("Сделка не найдена");
            }

            string path;
            try
            {
                var convertedDealName = FixInvalidChars(new StringBuilder(deal.Name), '-').Trim();

                path = Path.Combine(environment.WebRootPath,
                    "uploads", convertedDealName, "oldCrmFiles");
            }
            catch (Exception e)
            {
                log.Error(e.InnerException);
                Response.StatusCode = 404;
                return Content("Path exception");
            }

            var files = Directory.GetFiles(path);
            var filePath = files.FirstOrDefault(f => f.Contains(fileName));
            var provider = new PhysicalFileProvider(path);
            var fileNameAtDir = Path.GetFileName(filePath);
            var fileInfo = provider.GetFileInfo(fileNameAtDir);
            var readStream = fileInfo.CreateReadStream();
            new FileExtensionContentTypeProvider().TryGetContentType(fileNameAtDir, out var contentType);
            contentType ??= "application/octet-stream";

            return File(readStream, contentType, fileName);
        }

        [HttpGet("GetAdditionalFile/{dealId}/{fileName}")]
        [Authorize("DocumentServerCheckIP")]
        public IActionResult GetAdditionalFile(Guid dealId, string fileName)
        {
            Deal deal;
            try
            {
                deal = applicationContext.Deals.FirstOrDefault(b => b.Id == dealId);
                
                if(deal == null)
                    return Content("Сделка не найдена");
            }
            catch (Exception e)
            {
                log.Error(e.InnerException);
                Response.StatusCode = 404;
                return Content("Сделка не найдена");
            }

            string path;
            try
            {
                var convertedDealName = FixInvalidChars(new StringBuilder(deal.Name), '-').Trim();

                path = Path.Combine(environment.WebRootPath,
                    "uploads", convertedDealName, "additionalFiles");
            }
            catch (Exception e)
            {
                log.Error(e.InnerException);
                Response.StatusCode = 404;
                return Content("Path exception");
            }

            var files = Directory.GetFiles(path);
            var filePath = files.FirstOrDefault(f => f.Contains(fileName));
            var provider = new PhysicalFileProvider(path);
            var fileNameAtDir = Path.GetFileName(filePath);
            var fileInfo = provider.GetFileInfo(fileNameAtDir);
            var readStream = fileInfo.CreateReadStream();
            new FileExtensionContentTypeProvider().TryGetContentType(fileNameAtDir, out var contentType);
            contentType ??= "application/octet-stream";

            return File(readStream, contentType, fileName);
        }

        // GET: api/Files/5
        [HttpGet("{dealId}/{fileType}/{fileName}", Name = "Get")]
        [Authorize("DocumentServerCheckIP")]
        public ActionResult GetFile(Guid dealId, string fileType, string fileName)
		{
			Deal deal;
			try
            {
                log.Info($"DocumentServer is {HttpContext.Connection.RemoteIpAddress}");
                deal = applicationContext.Deals.FirstOrDefault(b => b.Id == dealId);

                if(deal == null)
                    throw new Exception("Deal Not Found At the method GetFile");
			}
			catch
			{
				Response.StatusCode = 404;
				return Content("Сделка не найдена");
			}

			string path;
			try
			{
                var convertedDealName = FixInvalidChars(new StringBuilder(deal.Name), '-').Trim();
                path = Path.Combine(environment.WebRootPath,
				"uploads", convertedDealName, fileType);
			}
			catch (Exception)
			{
				Response.StatusCode = 404;
				return Content("Ошибка пути");
			}

            if(!Directory.Exists(path))
                return Content("Файл не загружен");

            var files = Directory.GetFiles(path);
            var filePath = files.FirstOrDefault(f => f.Contains(fileName));
            var provider = new PhysicalFileProvider(path);
            var fileNameAtDir = Path.GetFileName(filePath);
            var fileInfo = provider.GetFileInfo(fileNameAtDir);
            var readStream = fileInfo.CreateReadStream();
            new FileExtensionContentTypeProvider().TryGetContentType(fileNameAtDir, out var contentType);
            contentType ??= "application/octet-stream";

            return File(readStream, contentType, fileName);
        }

		[HttpPost]
        [Authorize]
        [DisableRequestSizeLimit]
        [Route("~/api/UploadAttachment")]
		public async Task<ActionResult> UploadAttachment(IFormFile[] files, string dealId, string fileId)
        {
            if(files.Length == 0)
                return Json(new
                {
                    Method = "upload",
                    Success = false,
                    Message = "file is null",
                    dealId,
                    fileId
                });

            var user = await userManager.GetCurrentUserAsync();
            var convertedDealName = FixInvalidChars(new StringBuilder(dealId), '-').Trim();

            foreach (var file in files)
            {
                var convertedFileName = file.FileName.Replace('+', '_').Trim();

                var path = Path.Combine("uploads", convertedDealName, fileId, convertedFileName).Replace('\"', ' ');
                var fullPath = Path.Combine(environment.WebRootPath, path);
                var directory = Path.GetDirectoryName(fullPath);

                Directory.CreateDirectory(directory);

                await using (var fileStream = new FileStream(fullPath, FileMode.Create))
                    await file.CopyToAsync(fileStream);

                await applicationContext.Files.AddAsync(new Files { Path = fullPath, UserAuthor = user });

                log.Info($"{user.Id} added file {fileId} named {convertedFileName} at deal {dealId}");
            }

            await applicationContext.SaveChangesAsync();

            return Json(new
			{
				Method = "upload",
				Success = true,
				Message = "OK",
				dealId,
				fileId
			});
		}

        [HttpPost("UploadAdditionalAttachments")]
        [DisableRequestSizeLimit]
        [Authorize]
        public async Task<ActionResult> UploadAdditionalAttachments(IFormFile[] files, string dealName)
        {
            if (files.Length == 0)
                return Json(new
                {
                    Method = "upload",
                    Success = false,
                    Message = "files is null",
                    dealName
                });

            var deal = await applicationContext.Deals.FirstOrDefaultAsync(d => d.Name.Contains(dealName));

            if (deal == null)
            {
                log.Error($"Deal {dealName} was not found");
            } 

            var dealNameFixed = FixInvalidChars(new StringBuilder(dealName), '-').Trim();

            var user = await userManager.GetCurrentUserAsync();

            foreach (var file in files)
            {
                var convertedFileName = file.FileName.Replace('+', '_').Trim();

                var path = Path.Combine("uploads", dealNameFixed, "additionalFiles", convertedFileName).Replace('\"', ' ');
                var fullPath = Path.Combine(environment.WebRootPath, path);
                var directory = Path.GetDirectoryName(fullPath);

                Directory.CreateDirectory(directory);

                await using (var fileStream = new FileStream(fullPath, FileMode.Create))
                    await file.CopyToAsync(fileStream);

                await applicationContext.Files.AddAsync(new Files { Path = fullPath, UserAuthor = user, AddedAfterClosing = deal?.IsClosed ?? false});

                log.Info($"{user.Id} added additional file named {convertedFileName} at deal named {dealNameFixed}");
            }

            await applicationContext.SaveChangesAsync();

            return Json(new
            {
                Method = "upload",
                Success = true,
                Message = "OK",
                dealName
            });
        }

        [HttpGet("Attachments")]
        [Authorize]
        public async Task<ActionResult> GetAttachements(string dealId, string fileId)
		{
            try
            {
                var dealNameFixed = FixInvalidChars(new StringBuilder(dealId), '-').Trim();

                var fullPath = Path.Combine(
                        environment.WebRootPath,
                        "uploads",
                        dealNameFixed,
                        fileId)
                    .Replace('\"', ' ');

                if (Directory.Exists(fullPath))
                {
                    var relativePath = Path.Combine("/uploads", dealNameFixed, fileId).Replace('\"', ' ');
                    var fileEntries = Directory.GetFiles(fullPath);
                    var attachmentsData = new List<DropzoneData>();

                    foreach (var fileEntry in fileEntries)
                    {
                        try
                        {
                            var a = await applicationContext.Files
                                .Include(f => f.UserAuthor)
                                .FirstOrDefaultAsync(f => f.Path == fileEntry);
                        }
                        catch (Exception e)
                        {
                            Console.WriteLine(e);
                            throw;
                        }

                        var fileAuthor = await applicationContext.Files
                            .Include(f => f.UserAuthor)
                            .FirstOrDefaultAsync(f => f.Path == fileEntry);

                        attachmentsData.Add(
                            new DropzoneData
                            {
                                FullPath = fileEntry,
                                RelativePath = Path.Combine(relativePath, Path.GetFileName(fileEntry)),
                                Size = new FileInfo(fileEntry).Length,
                                FileName = Path.GetFileName(fileEntry),
                                AuthorName = fileAuthor?.UserAuthor?.DisplayName
                            });
                    }

                    return Json(new {attachmentsData});
                }

                return Json(false);
            } catch(Exception e)
            {
                var dx = e;
                return Json(false);
            }
        }

        [HttpGet("AdditionalAttachements")]
        [Authorize]
        public async Task<ActionResult> GetAdditionalAttachements(string dealName)
        {
            var dealNameFixed = FixInvalidChars(new StringBuilder(dealName), '-').Trim();

            var fullPath = Path.Combine(environment.WebRootPath,
                "uploads", dealNameFixed, "additionalFiles").Replace('\"', ' ');

            if (Directory.Exists(fullPath))
            {
                var relativePath = Path.Combine("/uploads", dealNameFixed, "additionalFiles").Replace('\"', ' ');
                var fileEntries = Directory.GetFiles(fullPath);
                var attachmentsData = new List<DropzoneData>();

                foreach (var fileEntry in fileEntries)
                {
                    var fileAuthor = await applicationContext.Files
                        .Include(f => f.UserAuthor)
                        .FirstOrDefaultAsync(f => f.Path == fileEntry);

                    attachmentsData.Add(new DropzoneData
                    {
                        FullPath = fileEntry,
                        RelativePath = Path.Combine(relativePath, Path.GetFileName(fileEntry)),
                        Size = new FileInfo(fileEntry).Length,
                        FileName = Path.GetFileName(fileEntry),
                        AuthorName = fileAuthor?.UserAuthor?.DisplayName
                    });
                }
                return Json(new { attachmentsData });
            }

            return Json(false);
        }

        [HttpGet("OldFiles")]
        [Authorize]
        public ActionResult GetAllOldFiles(Guid dealId)
        {
            var dealName = applicationContext.Deals.FirstOrDefault(d => d.Id == dealId)?.Name;
            var dealNameFixed = FixInvalidChars(new StringBuilder(dealName), '-').Trim();
            var filesLine = new List<FileData>();

            var fullPath = Path.Combine(environment.WebRootPath,
                "uploads", dealNameFixed, "oldCrmFiles").Replace('\"', ' ');

            try
            {
                var dir = new DirectoryInfo(fullPath);

                foreach (var it in dir.GetFiles())
                {
                    filesLine.Add(new FileData
                    {
                        FileName = it.Name,
                        Date = it.LastWriteTime,
                        Size = $"{it.Length / 1024.0:f1}" + " KB",
                        Id = it.Name
                    });
                }

                if (filesLine.Count == 0)
                    return Json("Files not found");

                return Json(filesLine);
            }
            catch (Exception e)
            {
                //TODO: как-то по-другому залогать
                log.Warn("Пустые логи из-за логирования InnerException, которого нет");
                log.Error(e.InnerException);
                return Json("Files not found");
            }
        }

        [HttpGet("AdditionalFiles")]
        [Authorize]
        public async Task<ActionResult> GetAllAdditionalFiles(Guid dealId)
        {
            var dealName = applicationContext.Deals.FirstOrDefault(d => d.Id == dealId)?.Name;
            var dealNameFixed = FixInvalidChars(new StringBuilder(dealName), '-').Trim();
            var filesLine = new List<FileData>();

            var fullPath = Path.Combine(environment.WebRootPath,
                "uploads", dealNameFixed, "additionalFiles").Replace('\"', ' ');

            try
            {
                var dir = new DirectoryInfo(fullPath);

                foreach (var it in dir.GetFiles())
                {
                    var fileAuthor = await applicationContext.Files
                        .Include(f => f.UserAuthor)
                        .FirstOrDefaultAsync(f => f.Path == it.FullName);

                    filesLine.Add(new FileData
                    {
                        FileName = it.Name,
                        Date = it.LastWriteTime,
                        Size = $"{it.Length / 1024.0:f1}" + " KB",
                        Id = it.Name,
                        AuthorName = fileAuthor?.UserAuthor?.DisplayName,
                        AddedAfterClosing = fileAuthor?.AddedAfterClosing ?? false
                    });
                }

                if (filesLine.Count == 0)
                    return Json("Files not found");

                return Json(filesLine);
            }
            catch (Exception e)
            {
                log.Error(e.InnerException);
                return Json("Files not found");
            }
        }

        [HttpGet("CloudLinks")]
        [Authorize]
        public async Task<CloudLinkListItemDto[]> GetAllCloudLinks(Guid dealId)
        {
            var cloudLinks = await applicationContext.CloudLinks
                .Include(c => c.Author)
                .Where(c => c.DealId == dealId)
                .ToArrayAsync();

            var cloudLinkList = new CloudLinkListItemDto[cloudLinks.Length];

            for (var i = 0; i < cloudLinks.Length; i++)
            {
                cloudLinkList[i] = new CloudLinkListItemDto
                {
                    AuthorName = cloudLinks[i].Author.DisplayName,
                    CreationDate = cloudLinks[i].AddingDateTime,
                    Link = cloudLinks[i].Link,
                    LinkName = cloudLinks[i].LinkName
                };
            }

            return cloudLinkList;
        }

        [HttpDelete("CloudLinks")]
        [Authorize]
        public async Task<ActionResult> RemoveCloudLink(Guid dealId, string linkName)
        {
            var cloudLink = await applicationContext.CloudLinks
                .SingleOrDefaultAsync(c => c.DealId == dealId && c.LinkName == linkName);

            if (cloudLink == null)
                return StatusCode(StatusCodes.Status404NotFound);

            applicationContext.Remove(cloudLink);

            await applicationContext.SaveChangesAsync();

            return StatusCode(StatusCodes.Status200OK);
        }

        [HttpGet("Deals/{dealId}")]
        [Authorize]
		public async Task<ActionResult> GetAllFilesAsync([FromRoute] Guid dealId)
		{
			var dealName = applicationContext.Deals.FirstOrDefault(d => d.Id == dealId)?.Name;
            var dealNameFixed = FixInvalidChars(new StringBuilder(dealName), '-').Trim();
            var filesLine = new List<FileData>();

			var fullPath = Path.Combine(environment.WebRootPath,
			"uploads", dealNameFixed).Replace('\"', ' ');

			try
			{
				var dir = new DirectoryInfo(fullPath);
				foreach (var item in dir.GetDirectories())
				{
					foreach (var it in item.GetFiles())
					{
                        var fileAuthor = await applicationContext.Files
                            .Include(f => f.UserAuthor)
                            .FirstOrDefaultAsync(f => f.Path == it.FullName);

                        filesLine.Add(new FileData
						{
							FileName = it.Name,
							Date = it.LastWriteTime,
							Size = String.Format("{0:f1}", it.Length / 1024.0) + " KB",
							Id = item.Name,
                            AuthorName = fileAuthor?.UserAuthor?.DisplayName
                        });
					}
				}

				foreach (var item in dir.GetFiles())
				{
                    filesLine.Add(new FileData
					{
						FileName = item.Name,
						Date = item.LastWriteTime,
						Size = $"{item.Length / 1024.0:f1}" + " KB",
						Id = dir.Name
					});
				}
				if (filesLine.Count == 0)
					return Json("Files not found");

				return Json(filesLine);
			}
			catch (Exception e)
			{
                log.Error(e.InnerException);
                return Json("Files not found");
			}
		}

		[HttpDelete]
        [Authorize]
		public async Task<ActionResult> Delete(string dealId, string fileType, string fileName)
		{
            var deal = await applicationContext.Deals.SingleOrDefaultAsync(d => d.Name == dealId);

            if (deal != null && deal.IsClosed)
                return Forbid();

			try
			{
                var dealNameFixed = FixInvalidChars(new StringBuilder(dealId), '-').Trim();
                var directoryPath = Path.Combine(environment.WebRootPath,
              "uploads", dealNameFixed, fileType);
                var filePath = Path.Combine(environment.WebRootPath,
                    "uploads", dealNameFixed, fileType, fileName);
                if (Directory.Exists(directoryPath))
                    System.IO.File.Delete(filePath);

                var files = applicationContext.Files.Where(f => f.Path.Contains(filePath));
                applicationContext.Files.RemoveRange(files);
                await applicationContext.SaveChangesAsync();

            }
            catch (Exception e)
			{
                log.Error(e.InnerException);
                Response.StatusCode = 404;
				return Content("Ошибка пути");
			}
			return Ok();
		}

        [HttpPut("Replace")]
        [Authorize]
        public async Task<ActionResult> Replace(Guid dealId, string fileId, IFormFile[] files)
        {
            var deal = await applicationContext.Deals.SingleOrDefaultAsync(d => d.Id == dealId);

            if (deal != null && deal.IsClosed)
                return Forbid();

            if (deal == null)
                return NotFound();

            try
            {
                var dealNameFixed = FixInvalidChars(new StringBuilder(deal.Name), '-').Trim();
                var directoryPath = Path.Combine(environment.WebRootPath,
                    "uploads", dealNameFixed, fileId);
                if (Directory.Exists(directoryPath))
                {
                    var dirInfo = new DirectoryInfo(directoryPath);
                    foreach (var file in dirInfo.GetFiles())
                    {
                        file.Delete();
                    }
                }

                var fileInfo = applicationContext.Files.Where(f => f.Path.Contains(directoryPath));
                applicationContext.Files.RemoveRange(fileInfo);

                var user = await userManager.GetCurrentUserAsync();

                foreach (var file in files)
                {
                    var convertedFileName = file.FileName.Replace('+', '_').Trim();

                    var path = Path.Combine("uploads", dealNameFixed, fileId, convertedFileName).Replace('\"', ' ');
                    var fullPath = Path.Combine(environment.WebRootPath, path);
                    var directory = Path.GetDirectoryName(fullPath);

                    Directory.CreateDirectory(directory);

                    await using (var fileStream = new FileStream(fullPath, FileMode.Create))
                        await file.CopyToAsync(fileStream);

                    await applicationContext.Files.AddAsync(new Files { Path = fullPath, UserAuthor = user });

                    log.Info($"{user.Id} replaced file {fileId} to {convertedFileName} at deal {deal.Name}");
                }

                await applicationContext.SaveChangesAsync();

            }
            catch (Exception e)
            {
                log.Error(e.InnerException);
                log.Error("Ошибка при замене файла");
                Response.StatusCode = 500;
                return Content("Ошибка при замене файла");
            }
            return Ok();
        }

        [HttpDelete("OldFile")]
        [Authorize]
        public async Task<ActionResult> DeleteOldFile(string dealId, string fileName)
        {
            var deal = await applicationContext.Deals.SingleOrDefaultAsync(d => d.Name == dealId);

            if (deal != null && deal.IsClosed)
                return Forbid();

            try
            {
                var dealNameFixed = FixInvalidChars(new StringBuilder(dealId), '-').Trim();
                var directoryPath = Path.Combine(environment.WebRootPath,
                    "uploads", dealNameFixed, "oldCrmFiles");
                var filePath = Path.Combine(environment.WebRootPath,
                    "uploads", dealNameFixed, "oldCrmFiles", fileName);

                if (Directory.Exists(directoryPath))
                    System.IO.File.Delete(filePath);
            }
            catch (Exception e)
            {
                log.Error(e.InnerException);
                Response.StatusCode = 404;
                return Content("Ошибка пути");
            }
            return Ok();
        }

        [HttpDelete("AdditionalFile")]
        [Authorize]
        public async Task<ActionResult> DeleteAdditionalFile(string dealId, string fileName)
        {
            var deal = await applicationContext.Deals.SingleOrDefaultAsync(d => d.Name == dealId);

            if (deal != null && deal.IsClosed)
                return Forbid();

            try
            {
                var dealNameFixed = FixInvalidChars(new StringBuilder(dealId), '-').Trim();
                var directoryPath = Path.Combine(environment.WebRootPath,
                    "uploads", dealNameFixed, "additionalFiles");
                var filePath = Path.Combine(environment.WebRootPath,
                    "uploads", dealNameFixed, "additionalFiles", fileName);

                if (Directory.Exists(directoryPath))
                    System.IO.File.Delete(filePath);

                var file = await applicationContext.Files.FirstOrDefaultAsync(f => f.Path == filePath);
                applicationContext.Files.Remove(file);
                await applicationContext.SaveChangesAsync();
            }
            catch (Exception e)
            {
                log.Error(e.InnerException);
                Response.StatusCode = 404;
                return Content("Ошибка пути");
            }
            return Ok();
        }

        public static string FixInvalidChars(StringBuilder text, char replaceTo)
        {
            if (text == null)
            {
                throw new ArgumentNullException("text");
            }
            if (text.Length <= 0)
            {
                return text.ToString();
            }

            foreach (var badChar in Path.GetInvalidPathChars())
            {
                text.Replace(badChar, replaceTo);
            }

            foreach (var badChar in new[] { '?', '\\', '/', ':', '"', '*', '>', '<', '|', '+' })
            {
                text.Replace(badChar, replaceTo);
            }
            return text.ToString();
        }

        private class FileData
		{
			public DateTime Date { get; set; }
			public string FileName { get; set; }
			public string Size { get; set; }
			public string Id { get; set; }
            public string AuthorName { get; set; }
            public bool AddedAfterClosing { get; set; }
        }

		private class DropzoneData
		{
			public string FullPath { get; set; }
			public string RelativePath { get; set; }
			public string FileName { get; set; }
			public long Size { get; set; }
            public string AuthorName { get; set; }
            public bool AddedAfterClosing { get; set; }
        }
	}
}

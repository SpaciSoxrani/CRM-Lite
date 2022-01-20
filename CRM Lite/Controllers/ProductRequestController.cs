using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.API.Data;
using CRM.API.Infrastructure;
using CRM.API.Utilities;
using CRM.API.Utilities.EmailManagers;
using CRM.API.Utilities.ExtensionMethods;
using CRM.API.Utilities.HttpClientServices;
using CRM.Data;
using CRM.Data.AuxiliaryModels;
using CRM.Data.Dtos;
using CRM.Data.Dtos.ProductRequest;
using CRM.Data.Models;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using Microsoft.Extensions.Caching.Memory;
using Vostok.Logging.Abstractions;

namespace CRM.API.Controllers
{
	[Produces("application/json")]
	[Route("api/ProductRequests")]
    [Authorize]
    public class ProductRequestController : Controller
	{
		private readonly ApplicationContext applicationContext;
        private readonly IAccessManager accessManager;
        private readonly IEmailProductRequestManager emailManager;
        private readonly IBackgroundJobClient backgroundJob;
        private readonly IMapper mapper;
        private readonly UserManager userManager;
        private readonly IJiraHttpClient jiraHttpClient;
        private IMemoryCache cache;
        private readonly ILog log;

        private readonly HashSet<string> fullAccessRoleNames = new HashSet<string>
        {
            "Администратор",
            "TOP-менеджер",
            "Менеджер по СМК"
        };

        public ProductRequestController(ApplicationContext context, IEmailProductRequestManager emailManager, ILog log, IAccessManager accessManager, UserManager userManager, IBackgroundJobClient backgroundJob, IJiraHttpClient jiraHttpClient, IMemoryCache cache, IMapper mapper)
        {
            applicationContext = context;
            this.userManager = userManager;
            this.accessManager = accessManager;
            this.emailManager = emailManager;
            this.backgroundJob = backgroundJob;
            this.jiraHttpClient = jiraHttpClient;
            this.mapper = mapper;
            this.cache = cache;
            this.log = log;
        }

        [HttpGet("Deal/{dealId}")]
        public async Task<ActionResult<ProductRequest>> GetRequestsForDeal([FromRoute] Guid dealId)
		{
			if (!ModelState.IsValid)			
				return BadRequest(ModelState);

            var listOfRequests = await applicationContext.ProductRequests
                .Include(e => e.Quests)
                .Include(e => e.ResponsibleUser)
                .Include(e => e.VendorsRequests).ThenInclude(e => e.Responsible)
                .Include(e => e)
                .Where(e => e.DealId == dealId)
                .ToListAsync();

            return Json(listOfRequests);
		}

        [HttpPut("MakeInvisible/{id}")]
        public async Task<IActionResult> MakeInvisible([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var productRequest = await applicationContext.ProductRequests
                .Include(d => d.Deal)
                .ThenInclude(d => d.ResponsibleUser)
                .SingleOrDefaultAsync(m => m.Id == id);

            var oldProductRequest = await applicationContext.OldProductRequests.SingleOrDefaultAsync(m => m.Id == id);

            if (productRequest == null)
            {
                if (oldProductRequest == null)
                {
                    return NotFound();
                }

                oldProductRequest.IsVisible = false;
            }
            else
            {
                var user = await userManager.GetCurrentUserAsync();

                if (!user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name)) &&
                    productRequest.Deal?.ResponsibleUserId != user.Id &&
                    productRequest.Deal?.ResponsibleUser?.ManagerId != user.Id)
                    return StatusCode(403);

                productRequest.IsVisible = false;
            }
            
            await applicationContext.SaveChangesAsync();

            return Ok(productRequest);
        }

        [HttpGet("ForList/{userId}")]
        public async Task<DatatablesDto> GetRequestsForList([FromRoute] Guid userId, [FromQuery] int start, int length)
        {
            var draw = Request.Query["draw"].FirstOrDefault(); //Datatables service param

            var search = Request.Query["search[value]"].FirstOrDefault();

            var sortColumn = Request.Query["columns[" + Request.Query["order[0][column]"].FirstOrDefault() + "][data]"].FirstOrDefault();

            var sortColumnDirection = Request.Query["order[0][dir]"].FirstOrDefault();

            if (!cache.TryGetValue("productRequestsForList" + userId, out List<ProductRequestListDto> requests))
            {
                requests = await applicationContext.ProductRequests
                    .Include(e => e.Quests)
                    .Include(e => e.ResponsibleUser)
                    .Include(e => e.VendorsRequests).ThenInclude(e => e.Responsible)
                    .Include(r => r.Deal).ThenInclude(d => d.DealAccessLists)
                    .Include(r => r.Deal).ThenInclude(d => d.DealAdditionalAccessLists)
                    .Where(x => x.Deal.DealAccessLists.Any(y => y.UserId == userId) ||
                                x.Deal.DealAdditionalAccessLists.Any(y => y.UserId == userId))
                    .Select(r => new ProductRequestListDto
                    {
                        Id = r.Id,
                        Name = r.Name,
                        Quests = r.Quests.Select(q => q.Quest).FirstOrDefault(),
                        VendorsRequests = r.VendorsRequests.Select(v => v.Responsible == null ? "" : v.Responsible.DisplayName).JoinAsString(", "),
                        ResponsibleUser = r.ResponsibleUser == null ? "" : r.ResponsibleUser.DisplayName,
                        AnswerDate = r.AnswerDate.HasValue ? r.AnswerDate.Value.ToShortDateString() : "Не указана",
                        PreparationDate = r.CreationDate.HasValue ? r.CreationDate.Value.ToShortDateString() : "Не указана",
                        FinishDate = r.FinishDate.HasValue ? r.FinishDate.Value.ToShortDateString() : "Не указана"
                    }).ToListAsync();

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromSeconds(15));

                cache.Set("productRequestsForList" + userId, requests, cacheEntryOptions);
            }

            var requestsFiltered = requests
                .Where(x => string.IsNullOrWhiteSpace(search) || x.Name.Contains(search)).ToList();

            var data = requestsFiltered
                .OrderWithDirection(sortColumn, sortColumnDirection)
                .Skip(start)
                .Take(length)
                .ToArray();

            return new DatatablesDto
            {
                Data = data,
                RecordsTotal = requests.Count,
                RecordsFiltered = requestsFiltered.Count,
                Draw = Convert.ToInt32(draw)
            };
        }

        [HttpGet("OldRequests/{id}")]
        public async Task<JsonResult> GetOldRequest([FromRoute] Guid id)
        {
            var request = await applicationContext.OldProductRequests
                .Include(r => r.AdmContact)
                .Include(r => r.TechContact)
                .SingleOrDefaultAsync(r => r.Id == id);

            return Json(request);
        }

        [HttpGet("OldRequests/ForList/{dealId}")]
        public async Task<OldProductRequest> GetOldRequestList([FromRoute] Guid dealId)
        {
            var listOfRequests = await applicationContext.OldProductRequests
                .Include(r => r.AdmContact)
                .Include(r => r.TechContact)
                .SingleOrDefaultAsync(r => r.DealId == dealId);

            return listOfRequests;
        }

        [HttpGet("KanbanRequests/{userId}")]
        public async Task<JsonResult> GetRequestsForKanban([FromRoute] Guid userId)
        {
            var kanbanRequests =
                await applicationContext.ProductRequests.Include(p => p.Deal)
                    .Where(e => e.IsStarted || e.AnswerDate != null && !e.Deal.IsClosed)
                    .ToListAsync();

            var requestsFilteredByUserRights = accessManager.FilterRequestsByUserRightsAsync(userId, kanbanRequests);

            return Json(requestsFilteredByUserRights);
        }

        [HttpGet("{id}")]
		public async Task<ActionResult<ProductRequest>> GetRequest([FromRoute] Guid id)
		{
			if (!ModelState.IsValid)			
				return BadRequest(ModelState);			

			var request = await applicationContext.ProductRequests
				.Include(e => e.Quests)
				.Include(e => e.VendorsRequests)
                    .ThenInclude(vr => vr.Vendor)
                .Include(e => e.VendorsRequests)
                    .ThenInclude(vr => vr.Responsible)
                .Include(e => e.AnotherResponsiblesProductRequest)
				.Include(e => e.Deal)
                    .ThenInclude(d => d.PM)
                .Include(e => e.Deal)
                    .ThenInclude(d => d.ProductLineDeals)
                .AsNoTracking()
				.SingleOrDefaultAsync(m => m.Id == id);
			
			if (request == null)
				return NotFound();			
			
			return request;
		}

        [HttpGet("AccessToAddMp")]
        public async Task<ActionResult<bool>> GetAccessToAddMp()
        {
            var user = await userManager.GetCurrentUserAsync();

            if (user.UserRoles.Any(u => fullAccessRoleNames.Contains(u.Role.Name)))
                return Ok(true);

            var departmentNamesWithAccessToAddMp = new List<string>
            {
                "ДИС",
                "ОСиК",
                "Проектный отдел",
                "ОИР"
            };

            var isDepHeader = applicationContext.Departments
                .Any(d => departmentNamesWithAccessToAddMp.Contains(d.Name) && user.Id == d.ManagerId);

            if (isDepHeader)
                return Ok(true);

            return Ok(false);
        }

        [HttpPost("Start")]
		public async Task<IActionResult> SaveAndStartProductRequest([FromBody] ProductRequestStartDto productRequestStartDto)
		{
            log.Info("Product Request start Creating");

            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model at starting product Request");
                return BadRequest(ModelState.GetErrorMessages());
            }

            var user = await userManager.GetCurrentUserAsync();

            var quests = mapper.Map<QuestsForRequest[]>(productRequestStartDto.QuestDtos);
            var vendorsRequests = mapper.Map<VendorsRequest[]>(productRequestStartDto.VendorsRequestDtos);
            var productRequest = mapper.Map<ProductRequest>(productRequestStartDto);

            var deal = await applicationContext.Deals
                .Include(d => d.Organization)
                .SingleOrDefaultAsync(e => e.Id == productRequest.DealId);

            foreach (var vendorsRequest in vendorsRequests)
            {
                var vendor = await applicationContext.Vendors.SingleOrDefaultAsync(v => v.VendorGuid == vendorsRequest.VendorId);

                if (vendor != null)
                {
                    vendorsRequest.IsProductCorrect = !vendor.IsDepartment;

                    if (vendor.IsDepartment && productRequestStartDto.DealId.HasValue && deal.IndustrialDepartmentDealId.HasValue)
                        await AddProductUnitToDealIfNotExistsAsync(productRequestStartDto.DealId.GetValueOrDefault(), vendor.Name, deal.IndustrialDepartmentDealId.GetValueOrDefault());
                }
                else
                    vendorsRequest.IsProductCorrect = true;
            }

            productRequest.Quests = quests.ToList();
            productRequest.VendorsRequests = vendorsRequests.ToList();

            if (deal == null || deal.Organization == null)
            {
                log.Error("Deal or organization not found from dealId: " + productRequest.DealId);
                return UnprocessableEntity("Deal not found!");
            }

            var organization = await applicationContext.Organizations.SingleOrDefaultAsync(e => e.Id == deal.OrganizationId);

            if (organization == null)
            {
                log.Error("Organization not found at dealId: " + productRequest.DealId);
                return UnprocessableEntity("Deal doesn't have organization. Please, update it.");
            }

            var requestCount = await applicationContext.ProductRequests.CountAsync(e => e.DealId == deal.Id) + 1;

            productRequest.Name = "ЗП - " + deal.Name.Insert(deal.Name.IndexOf(']'), $"-{requestCount}");

            productRequest.ResponsibleUser = user;

            productRequest.IsStarted = true;

            productRequest.CreationDate ??= DateTime.Now;

            foreach (var productRequestQuest in productRequest.Quests)
                productRequestQuest.ChangedDate ??= DateTime.Now;

            applicationContext.ProductRequests.Add(productRequest);

            await UpdateAnotherResponsibles(productRequestStartDto.AnotherResponsiblesProductRequests, productRequest);

            await applicationContext.SaveChangesAsync();

            backgroundJob.Enqueue(() => accessManager.UpdateAccessForEntitiesAsync(new List<Guid> { deal.Id }));

            var apiFront = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/";
            var href = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/ProductRequests/ProductRequest/" + productRequest.Id;

            await emailManager.SendMessageAboutCreatingProductRequest(href, apiFront, productRequest.Id, deal.Id);
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Production")
                await CreateJiraTask(productRequest.Id, apiFront);

            return CreatedAtAction("SaveAndStartProductRequest", new EntityCreatedResultAuxiliaryModel { Id = productRequest.Id });
		}

        [HttpPost]
        public async Task<IActionResult> SaveProductRequest([FromBody] ProductRequestSaveDto productRequestSaveDto)
        {
            log.Info("Product Request start Creating");

            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model at starting product Request");
                return BadRequest(ModelState.GetErrorMessages());
            }

            var user = await userManager.GetCurrentUserAsync();

            var quests = mapper.Map<QuestsForRequest[]>(productRequestSaveDto.QuestDtos);
            var vendorsRequests = mapper.Map<VendorsRequest[]>(productRequestSaveDto.VendorsRequestDtos);
            var productRequest = mapper.Map<ProductRequest>(productRequestSaveDto);

            foreach (var vendorsRequest in vendorsRequests)
            {
                var vendor = await applicationContext.Vendors.SingleOrDefaultAsync(v => v.VendorGuid == vendorsRequest.VendorId);

                if (vendor != null)
                    vendorsRequest.IsProductCorrect = !vendor.IsDepartment;
                else
                    vendorsRequest.IsProductCorrect = true;
            }

            productRequest.Quests = quests.ToList();
            productRequest.VendorsRequests = vendorsRequests.ToList();

            var deal = await applicationContext.Deals
                .Include(d => d.Organization)
                .SingleOrDefaultAsync(e => e.Id == productRequest.DealId);

            if (deal == null || deal.Organization == null)
            {
                log.Error("Deal or organization not found from dealId: " + productRequest.DealId);
                return UnprocessableEntity("Deal not found!");
            }

            var organization = await applicationContext.Organizations.SingleOrDefaultAsync(e => e.Id == deal.OrganizationId);

            if (organization == null)
            {
                log.Error("Organization not found at dealId: " + productRequest.DealId);
                return UnprocessableEntity("Deal doesn't have organization. Please, update it.");
            }

            var requestCount = await applicationContext.ProductRequests.CountAsync(e => e.DealId == deal.Id) + 1;

            productRequest.Name = "ЗП - " + deal.Name.Insert(deal.Name.IndexOf(']'), $"-{requestCount}");

            productRequest.ResponsibleUser = user;

            productRequest.IsStarted = false;

            productRequest.CreationDate ??= DateTime.Now;

            foreach (var productRequestQuest in productRequest.Quests)
                productRequestQuest.ChangedDate ??= DateTime.Now;

            applicationContext.ProductRequests.Add(productRequest);

            await UpdateAnotherResponsibles(productRequestSaveDto.AnotherResponsiblesProductRequests, productRequest);

            await applicationContext.SaveChangesAsync();

            backgroundJob.Enqueue(() => accessManager.UpdateAccessForEntitiesAsync(new List<Guid> { deal.Id }));

            return CreatedAtAction("SaveProductRequest", new EntityCreatedResultAuxiliaryModel { Id = productRequest.Id });
        }

        [HttpPut("{productRequestId}")]
        public async Task<IActionResult> EditProductRequest([FromRoute] Guid productRequestId, [FromBody] ProductRequestSaveDto productRequestSaveDto)
        {
            log.Info("Product Request start editing");

            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model at editing product Request");
                return BadRequest(ModelState.GetErrorMessages());
            }

            var deal = await applicationContext.Deals.AsNoTracking().SingleOrDefaultAsync(d => d.Id == productRequestSaveDto.DealId);
            var oldProductRequest = await applicationContext.ProductRequests.AsNoTracking().SingleOrDefaultAsync(d => d.Id == productRequestId);

            var quests = mapper.Map<QuestsForRequest[]>(productRequestSaveDto.QuestDtos);
            var vendorsRequests = mapper.Map<VendorsRequest[]>(productRequestSaveDto.VendorsRequestDtos);
            var productRequest = mapper.Map<ProductRequest>(productRequestSaveDto);

            productRequest.IsStarted = false;
            productRequest.Id = productRequestId;
            productRequest.Name = oldProductRequest.Name;
            productRequest.CreationDate = DateTime.Now;
            productRequest.ResponsibleUserId = oldProductRequest.ResponsibleUserId;

            applicationContext.Entry(productRequest).State = EntityState.Modified;

            await applicationContext.SaveChangesAsync();

            await UpdateAnotherResponsibles(productRequestSaveDto.AnotherResponsiblesProductRequests, productRequest, true);

            await applicationContext.SaveChangesAsync();

            await UpdateQuestsForRequest(quests, productRequest, true);

            await applicationContext.SaveChangesAsync();

            await UpdateVendorsRequests(vendorsRequests, productRequest, true);

            await applicationContext.SaveChangesAsync();

            backgroundJob.Enqueue(() => accessManager.UpdateAccessForEntitiesAsync(new List<Guid> { deal.Id }));

            return CreatedAtAction("EditProductRequest", new EntityCreatedResultAuxiliaryModel { Id = productRequest.Id });
        }

        [HttpPut("{productRequestId}/Start")]
        public async Task<IActionResult> EditAndStartProductRequest([FromRoute] Guid productRequestId, [FromBody] ProductRequestStartDto productRequestStartDto)
        {
            log.Info("Product Request start editing");

            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model at editing product Request");
                return BadRequest(ModelState.GetErrorMessages());
            }

            var deal = await applicationContext.Deals.AsNoTracking().SingleOrDefaultAsync(d => d.Id == productRequestStartDto.DealId);
            var oldProductRequest = await applicationContext.ProductRequests.AsNoTracking().SingleOrDefaultAsync(d => d.Id == productRequestId);

            var quests = mapper.Map<QuestsForRequest[]>(productRequestStartDto.QuestDtos);
            var vendorsRequests = mapper.Map<VendorsRequest[]>(productRequestStartDto.VendorsRequestDtos);
            var productRequest = mapper.Map<ProductRequest>(productRequestStartDto);

            foreach (var vendorsRequest in vendorsRequests)
            {
                var vendor = await applicationContext.Vendors.SingleOrDefaultAsync(v => v.VendorGuid == vendorsRequest.VendorId);

                if (vendor != null)
                {
                    vendorsRequest.IsProductCorrect = !vendor.IsDepartment;

                    if (vendor.IsDepartment && deal.IndustrialDepartmentDealId.HasValue)
                        await AddProductUnitToDealIfNotExistsAsync(deal.Id, vendor.Name, deal.IndustrialDepartmentDealId.GetValueOrDefault());
                }
                else
                    vendorsRequest.IsProductCorrect = true;
            }

            productRequest.IsStarted = true;
            productRequest.Id = productRequestId;
            productRequest.Name = oldProductRequest.Name;
            productRequest.CreationDate = DateTime.Now;
            productRequest.ResponsibleUserId = oldProductRequest.ResponsibleUserId;

            applicationContext.Entry(productRequest).State = EntityState.Modified;

            await applicationContext.SaveChangesAsync();

            await UpdateAnotherResponsibles(productRequestStartDto.AnotherResponsiblesProductRequests, productRequest, true);

            await applicationContext.SaveChangesAsync();

            await UpdateQuestsForRequest(quests, productRequest, true);

            await applicationContext.SaveChangesAsync();

            await UpdateVendorsRequests(vendorsRequests, productRequest, true);

            await applicationContext.SaveChangesAsync();

            var apiFront = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/";
            var href = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/ProductRequests/ProductRequest/" + productRequest.Id;

            await emailManager.SendMessageAboutCreatingProductRequest(href, apiFront, productRequest.Id, deal.Id);
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Production")
                await CreateJiraTask(productRequest.Id, apiFront);

            backgroundJob.Enqueue(() => accessManager.UpdateAccessForEntitiesAsync(new List<Guid> { deal.Id }));

            return CreatedAtAction("EditAndStartProductRequest", new EntityCreatedResultAuxiliaryModel { Id = productRequest.Id });
        }

        private async Task UpdateAnotherResponsibles(Guid[] anotherResponsiblesIds, ProductRequest productRequest, bool needToClearLists = false)
        {
            if (needToClearLists)
            {
                var lists = applicationContext.AnotherResponsiblesProductRequest.Where(c => c.ProductRequestId == productRequest.Id);

                applicationContext.AnotherResponsiblesProductRequest.RemoveRange(lists);
            }

            var anotherResponsiblesList = new AnotherResponsiblesProductRequest[anotherResponsiblesIds.Length];

            for (var i = 0; i < anotherResponsiblesList.Length; i++)
            {
                var anotherResponsibleUser = await applicationContext.Users.SingleOrDefaultAsync(l => l.Id == anotherResponsiblesIds[i]);

                anotherResponsiblesList[i] = new AnotherResponsiblesProductRequest { ResponsibleUser = anotherResponsibleUser, ProductRequest = productRequest };
            }

            await applicationContext.AnotherResponsiblesProductRequest.AddRangeAsync(anotherResponsiblesList);
        }

        private async Task UpdateQuestsForRequest(QuestsForRequest[] questsForRequests, ProductRequest productRequest, bool needToClear = false)
        {
            if (needToClear)
            {
                var quests = applicationContext.QuestsForRequests.Where(c => c.RequestId == productRequest.Id);

                applicationContext.QuestsForRequests.RemoveRange(quests);
            }

            var questList = new QuestsForRequest[questsForRequests.Length];

            for (var i = 0; i < questList.Length; i++)
            {
                questList[i] = new QuestsForRequest { Quest = questsForRequests[i].Quest, RequestId = productRequest.Id, ChangedDate = DateTime.Now};
            }

            await applicationContext.QuestsForRequests.AddRangeAsync(questList);
        }

        private async Task UpdateVendorsRequests(VendorsRequest[] vendorsRequests, ProductRequest productRequest, bool needToClear = false)
        {
            if (needToClear)
            {
                var vendorsRequestsOld = applicationContext.VendorsRequests.Where(c => c.RequestId == productRequest.Id);

                applicationContext.VendorsRequests.RemoveRange(vendorsRequestsOld);
            }

            var vendorsRequestsNew = new VendorsRequest[vendorsRequests.Length];

            for (var i = 0; i < vendorsRequests.Length; i++)
            {
                var vendor = await applicationContext.Vendors.SingleOrDefaultAsync(l => l.VendorGuid == vendorsRequests[i].VendorId);
                var responsible = await applicationContext.Users.SingleOrDefaultAsync(l => l.Id == vendorsRequests[i].ResponsibleId);

                if(responsible != null)
                    vendorsRequestsNew[i] = new VendorsRequest { RequestId = productRequest.Id, VendorId = vendor?.VendorGuid, IsProductCorrect = vendor != null && !vendor.IsDepartment, ResponsibleId = responsible.Id};
            }

            await applicationContext.VendorsRequests.AddRangeAsync(vendorsRequestsNew);
        }

        private async Task CreateJiraTask(Guid requestId, string apiFront)
        {
            var productRequest = await applicationContext.ProductRequests
                .Include(d => d.Deal).ThenInclude(d => d.ResponsibleUser)
                .Include(d => d.Deal).ThenInclude(d => d.ProductUnitDeals).ThenInclude(d => d.ProductUnit)
                .Include(d => d.ResponsibleUser)
                .Include(d => d.Quests)
                .Include(d => d.VendorsRequests)
                .SingleOrDefaultAsync(d => d.Id == requestId);

            var productNames = string.Join(", ", productRequest.VendorsRequests.Select(v => v.Responsible.DisplayName));

            var isOpir = productRequest.Deal.ProductUnitDeals.Any(u => u.ProductUnit.Name == "ОПиР");
            var isOsik = productRequest.Deal.ProductUnitDeals.Any(u => u.ProductUnit.Name == "ОСиК" || u.ProductUnit.Name == "ОИР" || u.ProductUnit.Name == "ОИБ");

            var jiraTask = new JiraTask
            {
                DealLink = apiFront + "Deals/Deal/" + productRequest.Deal.Id,
                DealName = productRequest.Deal.Name,
                Description = productRequest.Quests[0]?.Quest,
                ProductManagerNamesString = productNames,
                ResponsibleProjectName = productRequest.Deal.ResponsibleUser?.DisplayName,
                ResponsibleRequestLogin = productRequest.ResponsibleUser?.Login,
                TaskDate = productRequest.CreationDate
            };

            if (isOpir)
            {
                jiraTask.ProjectKey = "OPIRPRESAL";
                await jiraHttpClient.CreateJiraTask(jiraTask);
            }

            if (isOsik)
            {
                jiraTask.ProjectKey = "OSICPRESAL";
                await jiraHttpClient.CreateJiraTask(jiraTask);
            }
        }

        [HttpPut("SwipeProductManager")]
        public async Task<ActionResult> SwipeProductManagerAsync([FromBody] SwipeProductManagerInfo swipeProductManagerInfo)
        {
            var request =
                await applicationContext.ProductRequests
                    .Include(pr => pr.VendorsRequests)
                    .Include(pr => pr.Deal)
                        .ThenInclude(d => d.Contact)
                            .ThenInclude(d => d.ResponsibleUser)
                                .ThenInclude(d => d.Manager)
                    .SingleOrDefaultAsync(pr => pr.Id == swipeProductManagerInfo.RequestId);

            var deal = await applicationContext.Deals
                .Include(d => d.ProductUnitDeals).ThenInclude(pd => pd.ProductUnit)
                .SingleOrDefaultAsync(d => d.Id == request.DealId);

            if (deal == null)
                return NotFound();

            var newPm = await applicationContext.Users.SingleOrDefaultAsync(U => U.Id == swipeProductManagerInfo.NewPmId);

            var departmentHead = await userManager.GetCurrentUserAsync();

            if(departmentHead == null)
                return StatusCode(403);

            var vendorRequest = request.VendorsRequests.FirstOrDefault(vr => vr.ResponsibleId == departmentHead.Id);

            if (vendorRequest == null)
            {
                log.Error("В заявке на продуктирование " + request.Id + " не найден vendorsRequest c ответственным " + departmentHead.Id);
                return NotFound();
            }

            vendorRequest.ResponsibleId = newPm.Id;
            vendorRequest.Comment = swipeProductManagerInfo.NewComment;
            vendorRequest.IsProductCorrect = true;

            await applicationContext.SaveChangesAsync();

            var apiFront = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/";
            var requestHref = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/ProductRequests/ProductRequest/" + request.Id;

            await emailManager.SendMessageAboutPurposePm(deal, request, departmentHead.Id, swipeProductManagerInfo.NewPmId, swipeProductManagerInfo.NewComment, apiFront, requestHref);

            return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = request.Id });
        }

        [HttpPut("AddAdditionalProduct")]
        public async Task<ActionResult<Deal>> AddAdditionalProduct([FromBody] AdditionalProductDto additionalProductDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var deal = await applicationContext.Deals
                .Include(d => d.ProductUnitDeals).ThenInclude(pd => pd.ProductUnit)
                .SingleOrDefaultAsync(d => d.Id == additionalProductDto.DealId);

            if (deal == null)
                return NotFound();

            var request = await applicationContext.ProductRequests.SingleOrDefaultAsync(r => r.Id == additionalProductDto.RequestId);

            if (request == null)
                return NotFound();

            var user = await userManager.GetCurrentUserAsync();

            var access = await accessManager.HasAccessToReadDealAsync(user.Id, deal.Id);

            if (!access)
                return StatusCode(403);

            var vendorsRequest = new VendorsRequest
            {
                RequestId = request.Id,
                ResponsibleId = additionalProductDto.PmId,
                Comment = additionalProductDto.CommentForPm
            };

            await applicationContext.VendorsRequests.AddAsync(vendorsRequest);

            var apiFront = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/";
            var requestHref = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/ProductRequests/ProductRequest/" + request.Id;

            await emailManager.SendMessageAboutPurposePm(deal, request, user.Id, additionalProductDto.PmId, additionalProductDto.CommentForPm, apiFront, requestHref);

            await applicationContext.SaveChangesAsync();

            return deal;
        }

        [HttpPut("Answer")]
        public async Task<ActionResult> AnswerOnProductRequest([FromBody] ProductRequestAnswerDto answerDto)
        {
            var user = await userManager.GetCurrentUserAsync();

            var vendorsRequests = await applicationContext.VendorsRequests
                .Where(v => v.RequestId == answerDto.RequestId && v.ResponsibleId == user.Id)
                .ToListAsync();

            foreach (var vendorsRequest in vendorsRequests)
            {
                vendorsRequest.AnswerDate = DateTime.Now;
                vendorsRequest.ExecutionDate = answerDto.ExecutionDate;
                vendorsRequest.IsAccepted = true;
            }

            var apiFront = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/";
            var requestHref = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/ProductRequests/ProductRequest/" + answerDto.RequestId;

            await emailManager.SendMessageAboutAcceptOrFinishProductRequest(requestHref, apiFront, answerDto.RequestId, user.Id, false, answerDto.ExecutionDate);

            await applicationContext.SaveChangesAsync();

            return StatusCode(StatusCodes.Status204NoContent);
        }

        [HttpPut("Complete/{requestId}")]
        public async Task<ActionResult> CompleteProductRequest([FromRoute] Guid requestId)
        {
            var user = await userManager.GetCurrentUserAsync();

            var vendorsRequests = await applicationContext.VendorsRequests
                .Where(v => v.RequestId == requestId && v.ResponsibleId == user.Id)
                .ToListAsync();

            foreach (var vendorsRequest in vendorsRequests)
            {
                vendorsRequest.IsFinished = true;
                vendorsRequest.FinishDate = DateTime.Now;
            }

            var apiFront = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/";
            var requestHref = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/ProductRequests/ProductRequest/" + requestId;

            await emailManager.SendMessageAboutAcceptOrFinishProductRequest(requestHref, apiFront, requestId, user.Id, true, DateTime.Now);

            await applicationContext.SaveChangesAsync();

            return StatusCode(StatusCodes.Status204NoContent);
        }

        private async Task AddProductUnitToDealIfNotExistsAsync(Guid dealId, string unitName, Guid parentDepartmentId)
        {
            var deal = await applicationContext.Deals
                .Include(d => d.ProductUnitDeals).ThenInclude(u => u.ProductUnit)
                .SingleOrDefaultAsync(d => d.Id == dealId);

            var dealHasUnit = deal.ProductUnitDeals.Any(d => d.ProductUnit.Name == unitName && d.DealId == deal.Id && d.ProductUnit.ParentDepartmentId == parentDepartmentId);

            if (!dealHasUnit)
            {
                var unit = await applicationContext.Departments.FirstOrDefaultAsync(d => d.Name == unitName && d.ParentDepartmentId == parentDepartmentId);

                await applicationContext.ProductUnitDeals.AddAsync(new ProductUnitDeal { DealId = deal.Id, ProductUnit = unit });
            }
        }
	}
}

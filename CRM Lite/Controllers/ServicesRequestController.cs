using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using CRM.API.Data;
using CRM.API.Infrastructure;
using CRM.API.Utilities;
using CRM.API.Utilities.DatatablesHelpers;
using CRM.API.Utilities.EmailManagers;
using CRM.API.Utilities.ExtensionMethods;
using CRM.Data;
using CRM.Data.Dtos;
using CRM.Data.Dtos.ServiceRequest;
using CRM.Data.Models;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using Microsoft.Extensions.Caching.Memory;
using Vostok.Logging.Abstractions;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/ServicesRequests")]
    [Authorize]
    public class ServicesRequestController : RequestsBase
    {
        private readonly IAccessManager accessManager;
        private readonly IBackgroundJobClient backgroundJob;
        private readonly IWebHostEnvironment environment;
        private readonly IEmailServiceRequestManager emailManager;
        private readonly IMemoryCache cache;
        private readonly ILog logger;
        private readonly IMapper mapper;

        public ServicesRequestController(
            ApplicationContext context,
            IEmailServiceRequestManager emailManager,
            IAccessManager accessManager,
            UserManager userManager,
            IBackgroundJobClient backgroundJob,
            IWebHostEnvironment environment,
            IMemoryCache cache,
            ILog logger,
            IMapper mapper)
            : base(context, userManager)
        {
            this.environment = environment;
            this.accessManager = accessManager;
            this.emailManager = emailManager;
            this.backgroundJob = backgroundJob;
            this.cache = cache;
            this.logger = logger;
            this.mapper = mapper;
        }

        [HttpGet]
        public async Task<IEnumerable<ServicesRequest>> GetRequests() =>
            await ApplicationContext.ServicesRequests.ToArrayAsync();

        [HttpGet("Deal/{dealId}")]
        public async Task<DatatablesDto> GetRequestsForDeal([FromRoute] Guid dealId)
        {
            logger.Info("Start getting service requests for deal.");
            var filter = FilterParser.Parse(Request);
            var stopwatchLog = StopwatchLog.StartNew(logger, "Loading service requests for deal");
            var requests = await GetAllServiceRequestsForDealAsync(dealId);
            var totalRequestsCount = requests.Count;
            stopwatchLog.StopWithLog();

            var filteringLog = StopwatchLog.StartNew(logger, "Filtering service requests for deal");
            if (!string.IsNullOrWhiteSpace(filter.SearchValue))
            {
                requests = requests
                    .Where(x => x.Name.ToLower().Contains(filter.SearchValue.ToLower()))
                    .ToList();
            }

            var filteredRequestsCount = requests.Count;
            var data = requests
                .OrderWithDirection(filter.SortColumn, filter.SortColumnDirection)
                .Skip(filter.Start)
                .Take(filter.Length)
                .ToArray();
            filteringLog.StopWithLog();

            return new DatatablesDto
            {
                Data = data,
                RecordsTotal = totalRequestsCount,
                RecordsFiltered = filteredRequestsCount,
                Draw = filter.Draw
            };
        }

        [HttpGet("ForList/{userId}")]
        public async Task<DatatablesDto> GetRequestsForList([FromRoute] Guid userId)
        {
            logger.Info("Start getting service requests.");
            var filter = FilterParser.Parse(Request);

            var stopwatchLog = StopwatchLog.StartNew(logger, "Loading service requests");
            var requests = await GetAllServiceRequestsForUserAsync(userId);
            var totalRequestsCount = requests.Count;
            stopwatchLog.StopWithLog();

            var filteringLog = StopwatchLog.StartNew(logger, "Filtering service requests");
            if (!string.IsNullOrWhiteSpace(filter.SearchValue))
            {
                requests = requests
                    .Where(x => x.Name.ToLower().Contains(filter.SearchValue.ToLower()))
                    .ToList();
            }

            var filteredRequestsCount = requests.Count;
            var data = requests
                .OrderWithDirection(filter.SortColumn, filter.SortColumnDirection)
                .Skip(filter.Start)
                .Take(filter.Length)
                .ToArray();
            filteringLog.StopWithLog();

            return new DatatablesDto
            {
                Data = data,
                RecordsTotal = totalRequestsCount,
                RecordsFiltered = filteredRequestsCount,
                Draw = filter.Draw
            };
        }

        [HttpGet("OldRequests/{id}")]
        public async Task<JsonResult> GetOldRequest([FromRoute] Guid id)
        {
            logger.Info($"Start getting old service request with id: {id}");

            var request = await ApplicationContext.OldServiceRequests
                .SingleOrDefaultAsync(r => r.Id == id);

            return Json(request);
        }

        [HttpGet("OldRequests/ForList/{dealId}")]
        public IQueryable<OldServiceRequest> GetOldRequestList([FromRoute] Guid dealId)
        {
            logger.Info($"Start getting old service requests by deal id: {dealId}");

            var listOfRequests = ApplicationContext.OldServiceRequests
                .Where(r => r.DealId == dealId);

            return listOfRequests;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServicesRequest>> GetRequest([FromRoute] Guid id)
        {
            logger.Info($"Start getting service request with id: {id}");
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var request = await ApplicationContext.ServicesRequests
                .Include(e => e.IndustrialUnitServicesRequests)
                .ThenInclude(sdd => sdd.IndustrialUnit)
                .Include(r => r.Department)
                .Include(e => e.AnotherResponsiblesServicesRequests)
                .Include(e => e.AnswersForServicesRequests)
                .ThenInclude(a => a.ResponsiblesForAnswers)
                .ThenInclude(r => r.ResponsibleUser)
                .Include(e => e.AnswersForServicesRequests)
                .ThenInclude(a => a.Department)
                .ThenInclude(d => d.Manager)
                .ThenInclude(d => d.Manager)
                .SingleOrDefaultAsync(m => m.Id == id);

            return request;
        }

        [HttpPut("ChangeIndustrialUnitAnswerInfo")]
        public async Task<ActionResult> ChangeIndustrialUnitInfo([FromBody] ServiceRequestAnswerChangeDto serviceRequestAnswerChangeDto)
        {
            var user = await UserManager.GetCurrentUserAsync();

            logger.Info($"User {user.Id} start changing industrial unit info, answer id: {serviceRequestAnswerChangeDto.AnswerId} with laboriousness: {serviceRequestAnswerChangeDto.Laboriousness}");

            var answer = await ApplicationContext.AnswersForServicesRequests
                .Include(a => a.ResponsiblesForAnswers)
                .SingleOrDefaultAsync(a => a.Id == serviceRequestAnswerChangeDto.AnswerId);

            ApplicationContext.ResponsiblesForAnswers.RemoveRange(answer.ResponsiblesForAnswers);

            foreach (var responsibleId in serviceRequestAnswerChangeDto.ResponsibleIds)
            {
                await ApplicationContext.ResponsiblesForAnswers.AddAsync(new ResponsiblesForAnswer {AnswerId = serviceRequestAnswerChangeDto.AnswerId, ResponsibleUserId = responsibleId, Answer = answer});
            }

            answer.ExecuteDate = serviceRequestAnswerChangeDto.ExecuteDate;
            answer.Comment = serviceRequestAnswerChangeDto.Comment ?? "";
            answer.Laboriousness = serviceRequestAnswerChangeDto.Laboriousness;


            await ApplicationContext.SaveChangesAsync();

            var originHref = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value];
            await emailManager.SendMessageAboutEditingServiceAnswerAsync(originHref, answer.ServicesRequestId, answer.Id, user.Id);

            logger.Info($"Complete changing industrial unit info, answer id: {serviceRequestAnswerChangeDto.AnswerId}");
            return NoContent();
        }

        [HttpPost("CanPointMp")]
        public async Task<ActionResult> CanPointMpAsync([FromBody] CanPointMpDto canPointMpDto)
        {
            logger.Info($"IN CanPointMpTask, user: {canPointMpDto.UserGuid}");

            var canPointMp = await ApplicationContext.Departments
                .Include(d => d.Users)
                .AnyAsync(
                    d =>
                        canPointMpDto.OrganizationGuids.Contains(d.Id) && d.ManagerId == canPointMpDto.UserGuid ||
                        d.Name == "Проектный отдел" && d.ManagerId == canPointMpDto.UserGuid ||
                        d.Name == "ОЛ" && canPointMpDto.OrganizationGuids.Contains(d.Id) && d.Users.Any(u => u.Id == canPointMpDto.UserGuid) ||
                        d.Name == "ОСиК" && d.ManagerId == canPointMpDto.UserGuid ||
                        d.Name == "ДИС" && d.ManagerId == canPointMpDto.UserGuid);

            return StatusCode(200, canPointMp);
        }

        // (20.11.2020) Работает только в Отделе Логистики
        [HttpPut("AcceptRequest")]
        public async Task<ActionResult> AcceptRequest([FromBody] AcceptAndFinishRequestModel acceptAndFinishRequestModel)
        {
            logger.Info($"Start accepting request, id {acceptAndFinishRequestModel.RequestId}");

            var requestAnswer = await ApplicationContext.AnswersForServicesRequests
                .Include(s => s.Department)
                .SingleOrDefaultAsync(s => s.ServicesRequestId == acceptAndFinishRequestModel.RequestId 
                                           && s.Department.Name == acceptAndFinishRequestModel.DepartmentName);

            if (requestAnswer == null)
            {
                logger.Warn($"Request answer not found by department name {acceptAndFinishRequestModel.DepartmentName} " +
                            $"and service request id {acceptAndFinishRequestModel.RequestId}");
                return NotFound();
            }

            if (!requestAnswer.IsAccepted)
            {
                logger.Info($"Request {requestAnswer.Id} is accepted");
                requestAnswer.IsAccepted = true;
                requestAnswer.ResponsibleAcceptDate = acceptAndFinishRequestModel.AcceptOrFinishDate;
                requestAnswer.ExecuteDate = acceptAndFinishRequestModel.AcceptOrFinishDate;
            }
            else if (!requestAnswer.IsFinished)
            {
                logger.Info($"Request {requestAnswer.Id} is finished");
                requestAnswer.IsFinished = true;
                requestAnswer.ResponsibleFinishDate = acceptAndFinishRequestModel.AcceptOrFinishDate;
                requestAnswer.ExecuteDate = acceptAndFinishRequestModel.AcceptOrFinishDate;
            }

            await ApplicationContext.SaveChangesAsync();

            await emailManager.SendMessageAboutAcceptOrFinishServiceRequestAsync(
                acceptAndFinishRequestModel.RequestId,
                requestAnswer.Id,
                acceptAndFinishRequestModel.UserId,
                acceptAndFinishRequestModel.AcceptOrFinishDate,
                acceptAndFinishRequestModel.CrmUrl,
                requestAnswer.IsFinished);
            logger.Info($"Complete accepting request, id {acceptAndFinishRequestModel.RequestId}");
            return NoContent();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutServicesRequest([FromRoute] Guid id, [FromBody] ServicesRequest servicesRequest)
        {
            if (!ModelState.IsValid || id != servicesRequest.Id)
            {
                logger.Warn(ModelState.GetErrorMessagesAsString());
                return BadRequest(ModelState.GetErrorMessages());
            }

            logger.Info($"Start updating service request {id}");

            await UpdateIndustrialUnitsAsync(servicesRequest);
            await UpdateAnotherResponsiblesAsync(servicesRequest);

            servicesRequest.CreationDate ??= DateTime.Now;

            ApplicationContext.Entry(servicesRequest).State = EntityState.Modified;

            try
            {
                await ApplicationContext.SaveChangesAsync();
            }
            catch (Exception e)
            {
                if (!await ServicesRequestExistsAsync(id))
                    return NotFound();

                throw;
            }

            if (servicesRequest.IsStarted)
            {
                var isOsikOrOir = await ApplicationContext.IndustrialUnitDeals
                    .AnyAsync(u => u.DealId == servicesRequest.DealId && (u.IndustrialUnit.Name == "ОСиК" || u.IndustrialUnit.Name == "ОИР") && u.Deal.IndustrialDepartmentDeal.Name == "ДИС");

                if (isOsikOrOir && servicesRequest.DealId.HasValue)
                    await AddAccessEngineerToDeal(servicesRequest.DealId.Value, true);

                await StartRequestAsync(servicesRequest);
            }

            logger.Info($"Complete updating service request {id}");
            return NoContent();
        }

        [HttpPost]
        public async Task<IActionResult> PostServicesRequest([FromBody] ServiceRequestPostDto requestDto)
        {
            if (!ModelState.IsValid)
            {
                logger.Warn(ModelState.GetErrorMessagesAsString());
                return BadRequest(ModelState.GetErrorMessages());
            }

            logger.Info("Start creating service request");

            var request = mapper.Map<ServicesRequest>(requestDto);

            request.CreationDate ??= DateTime.Now;

            var deal = await ApplicationContext.Deals
                .Include(d => d.IndustrialDepartmentDeal)
                .Include(s => s.IndustrialUnitDeals)
                .ThenInclude(u => u.IndustrialUnit)
                .AsNoTracking()
                .SingleAsync(e => e.Id == request.DealId);

            request.Name = await BuildRequestNameAsync(deal);
            request.DepartmentId = deal.IndustrialDepartmentDealId;

            AddAnotherResponsibles(request, requestDto.AnotherResponsibles);
            await AddIndustrialUnitsAsync(request, requestDto.IndustrialUnits);
            await AddProjectUnitsAsync(request, deal);
            if(request.IsStarted && deal.IndustrialUnitDeals.Any(u => u.IndustrialUnit.Name == "ОСиК" || u.IndustrialUnit.Name == "ОИР") && deal.IndustrialDepartmentDeal.Name == "ДИС")
                await AddAccessEngineerToDeal(deal.Id);

            await ApplicationContext.ServicesRequests.AddAsync(request);
            await ApplicationContext.SaveChangesAsync();

            backgroundJob.Enqueue(() => accessManager.UpdateAccessForEntitiesAsync(new List<Guid> {deal.Id}));

            if (request.IsStarted)
                await StartRequestAsync(request);

            return StatusCode(201, new {request.Id});
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServiceRequest([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var serviceRequest = await ApplicationContext.ServicesRequests.SingleOrDefaultAsync(m => m.Id == id);
            if (serviceRequest == null)
            {
                return NotFound();
            }

            ApplicationContext.ServicesRequests.Remove(serviceRequest);
            await ApplicationContext.SaveChangesAsync();

            return Ok(serviceRequest);
        }

        [HttpPut("MakeInvisible/{id}")]
        public async Task<IActionResult> MakeInvisible([FromRoute] Guid id)
        {
            logger.Info($"Start making invisible request {id}");
            return await MakeInvisible<ServicesRequest, OldServiceRequest>(id);
        }

        [HttpPost]
        [Route("~/api/SaveAnswer")]
        public async Task<IActionResult> SaveAnswer([FromBody] ServiceRequestAnswerDto answerDto)
        {
            if (!ModelState.IsValid)
            {
                logger.Warn(ModelState.GetErrorMessagesAsString());
                return BadRequest(ModelState.GetErrorMessages());
            }
            logger.Info($"Start saving answer to request. Request: {answerDto.ServicesRequestId}");
            try
            {
                await EnsureAnswerCanBePostedAsync(answerDto.ServicesRequestId, answerDto.DepartmentId);
            }
            catch (InvalidOperationException e)
            {
                logger.Warn($"Answer could not be posted: {e.Message}");
                return Json(e.Message);
            }

            var answer = mapper.Map<AnswersForServicesRequest>(answerDto);

            var request = await ApplicationContext.ServicesRequests.AsNoTracking().SingleAsync(r => r.Id == answer.ServicesRequestId);
            var department = await ApplicationContext.Departments.AsNoTracking().SingleAsync(d => d.Id == answer.DepartmentId);
            var user = await UserManager.GetCurrentUserAsync();

            answer.IsAccepted = true;
            if (department.Name == "ОЛ")
            {
                logger.Info($"Responsible accept date equals to execute date. Department: {department.Name}");
                answer.ResponsibleAcceptDate = answer.ExecuteDate;
            }

            if (department.Name != "ОЛ" && department.Name != "Проектный отдел")
            {
                logger.Info($"Laboriousness set to null. Department: {department.Name}");
                answer.Laboriousness = null;
            }

            logger.Info($"User {user.Id} answer in {answer.Id} with laboriousness: {answer.Laboriousness}");

            answer.ResponsiblesForAnswers = answerDto.ResponsiblePMs.Select(id => new ResponsiblesForAnswer {ResponsibleUserId = id}).ToArray();
            await ApplicationContext.AnswersForServicesRequests.AddAsync(answer);
            await ApplicationContext.SaveChangesAsync();

            backgroundJob.Enqueue(() => accessManager.UpdateAccessForEntitiesAsync(new List<Guid> {(Guid)request.DealId}));

            var originHref = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value];
            await emailManager.SendMessageAboutServiceAnswerAsync(originHref, request.Id, answer.Id, user.Id);

            return StatusCode(201, new {answer.Id});
        }

        private async Task<List<ServiceRequestListDto>> GetAllServiceRequestsForUserAsync(Guid userId)
        {
            if (cache.TryGetValue("serviceRequestsForList" + userId, out List<ServiceRequestListDto> requests))
                return requests;

            logger.Info("Loading service requests from database");

            ApplicationContext.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
            requests = await ApplicationContext.ServicesRequests
                .Include(e => e.ResponsibleUser)
                .Include(e => e.AnswersForServicesRequests)
                .ThenInclude(a => a.Department)
                .Include(e => e.AnswersForServicesRequests)
                .ThenInclude(a => a.ResponsiblePM)
                .Include(r => r.AnswersForServicesRequests)
                .ThenInclude(a => a.ResponsiblesForAnswers)
                .ThenInclude(r => r.ResponsibleUser)
                .Where(
                    x => x.Deal.DealAccessLists.Any(y => y.UserId == userId) ||
                         x.Deal.DealAdditionalAccessLists.Any(y => y.UserId == userId))
                .Select(
                    r => new ServiceRequestListDto
                    {
                        Id = r.Id,
                        Name = r.Name,
                        Service = r.Service,
                        ResponsibleUser = r.ResponsibleUser == null ? "" : r.ResponsibleUser.DisplayName,
                        ResponsiblePm = r.AnswersForServicesRequests.Select(a => a.Department == null ? "" : a.Department.Name + " - " + a.ResponsiblesForAnswers.Select(r => r.ResponsibleUser.DisplayName).JoinAsString(", ")).JoinAsString("\n"),
                        PreparationDate = r.CreationDate.HasValue ? r.CreationDate.Value.ToShortDateString() : "Не указана",
                        FinishDate = r.AnswersForServicesRequests.Select(a => a.Department == null ? "" : a.Department.Name + " - " + a.ExecuteDate.ToShortDateString()).JoinAsString("\n")
                    })
                .ToListAsync();
            ApplicationContext.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.TrackAll;
            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromSeconds(15));

            cache.Set("serviceRequestsForList" + userId, requests, cacheEntryOptions);

            return requests;
        }

        private async Task<List<ServiceRequestListDto>> GetAllServiceRequestsForDealAsync(Guid dealId)
        {
            if (cache.TryGetValue("serviceRequestsForDeal" + dealId, out List<ServiceRequestListDto> requests))
                return requests;

            logger.Info("Loading service requests from database");

            ApplicationContext.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
            requests = await ApplicationContext.ServicesRequests
                .Include(e => e.ResponsibleUser)
                .Include(e => e.AnswersForServicesRequests)
                .ThenInclude(a => a.Department)
                .Include(e => e.AnswersForServicesRequests)
                .ThenInclude(a => a.ResponsiblePM)
                .Include(r => r.AnswersForServicesRequests)
                .ThenInclude(a => a.ResponsiblesForAnswers)
                .ThenInclude(r => r.ResponsibleUser)
                .Where(x => x.DealId == dealId)
                .Select(
                    r => new ServiceRequestListDto
                    {
                        Id = r.Id,
                        Name = r.Name,
                        Service = r.Service,
                        ResponsibleUser = r.ResponsibleUser == null ? "" : r.ResponsibleUser.DisplayName,
                        ResponsiblePm = r.AnswersForServicesRequests.Select(a => a.Department == null ? "" : a.Department.Name + " - " + a.ResponsiblesForAnswers.Select(r => r.ResponsibleUser.DisplayName).Join(", ")).Join("\n"),
                        PreparationDate = r.CreationDate.HasValue ? r.CreationDate.Value.ToShortDateString() : "Не указана",
                        FinishDate = r.AnswersForServicesRequests.Select(a => a.Department == null ? "" : a.Department.Name + " - " + a.ExecuteDate.ToShortDateString()).Join("\n")
                    })
                .ToListAsync();

            var oldRequests = ApplicationContext.OldServiceRequests
                .Where(d => d.DealId == dealId)
                .Select(
                    r => new ServiceRequestListDto
                    {
                        Id = r.Id,
                        Name = "Заявка из старой CRM",
                        Service = r.ServiceCondition,
                        ResponsibleUser = "Не указан",
                        ResponsiblePm = "Не указан",
                        PreparationDate = "Не указана",
                        FinishDate = "Не указана"
                    });

            requests.AddRange(oldRequests);

            ApplicationContext.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.TrackAll;
            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromSeconds(15));

            cache.Set("serviceRequestsForDeal" + dealId, requests, cacheEntryOptions);

            return requests;
        }

        private async Task UpdateAnotherResponsiblesAsync(ServicesRequest servicesRequest)
        {
            var oldAnotherResponsibles = ApplicationContext.AnotherResponsiblesServicesRequests.Where(i => i.ServicesRequestId == servicesRequest.Id);
            ApplicationContext.AnotherResponsiblesServicesRequests.RemoveRange(oldAnotherResponsibles);
            await ApplicationContext.AnotherResponsiblesServicesRequests.AddRangeAsync(servicesRequest.AnotherResponsiblesServicesRequests);
        }

        private async Task UpdateIndustrialUnitsAsync(ServicesRequest servicesRequest)
        {
            var oldIndustrialUnits = ApplicationContext.IndustrialUnitServicesRequests.Where(i => i.ServicesRequestId == servicesRequest.Id);
            ApplicationContext.IndustrialUnitServicesRequests.RemoveRange(oldIndustrialUnits);
            await ApplicationContext.IndustrialUnitServicesRequests.AddRangeAsync(servicesRequest.IndustrialUnitServicesRequests);

            var industrialUnitsIds = servicesRequest.IndustrialUnitServicesRequests.Select(u => u.IndustrialUnitId).ToArray();

            if (servicesRequest.IsStarted && servicesRequest.DealId.HasValue)
                await AddIndustrialUnitToDealIfNotExistsAsync(servicesRequest.DealId.GetValueOrDefault(), industrialUnitsIds);
        }

        private async Task StartRequestAsync(ServicesRequest servicesRequest)
        {
            logger.Info($"Staring request {servicesRequest.Id}");

            var deal = await ApplicationContext.Deals.AsNoTracking().SingleOrDefaultAsync(d => d.Id == servicesRequest.DealId);
            var apiFront = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/";
            var href = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/ServicesRequests/ServicesRequest/" + servicesRequest.Id;
            var convertedDealName = FilesController.FixInvalidChars(new StringBuilder(deal.Name), '-').Trim();
            var fileContractPath = Path.Combine(
                environment.WebRootPath,
                "uploads",
                convertedDealName,
                "signed-file-contract-scan");

            var fileLink = "#";
            if (Directory.Exists(fileContractPath))
            {
                var fileEntry = Directory.GetFiles(fileContractPath)[0];
                var fileName = Path.GetFileName(fileEntry);
                fileLink = "https://" + Request.Host.Value + "/api/File/" + deal.Id + "/signed-file-contract-scan/" + fileName;
            }

            await emailManager.SendMessageAboutCreatingServiceRequestAsync(href, apiFront, servicesRequest.Id, deal.Id, fileLink);
        }

        private async Task<string> BuildRequestNameAsync(Deal deal)
        {
            var requestCount = await ApplicationContext
                .ServicesRequests
                .CountAsync(e => e.DealId == deal.Id) + 1;

            var name = "ЗУ - " + deal.Name.Insert(deal.Name.IndexOf(']'), $"-{requestCount}");

            logger.Info($"Name for creating request: {name}");
            return name;
        }

        private void AddAnotherResponsibles(ServicesRequest request, Guid[] anotherResponsiblesIds)
        {
            logger.Info($"Adding {anotherResponsiblesIds.Length} another responsibles to request {request.Name}");

            request.AnotherResponsiblesServicesRequests = anotherResponsiblesIds
                .Select(
                    id => new AnotherResponsiblesServicesRequest
                    {
                        ResponsibleId = id
                    })
                .ToList();
        }

        private async Task AddIndustrialUnitsAsync(ServicesRequest request, Guid[] industrialUnitsIds)
        {
            logger.Info($"Adding {industrialUnitsIds.Length} industrial units to request {request.Name}");

            request.IndustrialUnitServicesRequests = industrialUnitsIds
                .Select(
                    id => new IndustrialUnitServicesRequest
                    {
                        IndustrialUnitId = id
                    })
                .ToList();

            if (request.IsStarted && request.DealId.HasValue)
                await AddIndustrialUnitToDealIfNotExistsAsync(request.DealId.GetValueOrDefault(), industrialUnitsIds);
        }

        private async Task AddProjectUnitsAsync(ServicesRequest request, Deal requestDeal)
        {
            var isOsikOrOirAtDeal = requestDeal.IndustrialUnitDeals
                .Any(d => d.IndustrialUnit.Name == "ОСиК" || d.IndustrialUnit.Name == "ОИР");
            var isOsikOrOirAtRequest = await ApplicationContext
                .Departments
                .AnyAsync(
                    d => (d.Name == "ОСиК" || d.Name == "ОИР")
                         && request.IndustrialUnitServicesRequests
                             .Select(r => r.IndustrialUnitId)
                             .Contains(d.Id));
            var isDvs = requestDeal.IndustrialDepartmentDeal?.Name == "ДВС";
            var needToAddProjectUnitRequests = isOsikOrOirAtDeal || isOsikOrOirAtRequest || isDvs;
            if (needToAddProjectUnitRequests)
            {
                logger.Info($"Adding project unit to request {request.Name}");
                var projectUnit = await ApplicationContext.Departments
                    .Include(d => d.ParentDepartment)
                    .SingleOrDefaultAsync(
                        d =>
                            d.Name.Contains("Проектный") && d.ParentDepartment.Id == request.DepartmentId);

                if (projectUnit != null)
                {
                    logger.Info($"Project unit found: {projectUnit.Name}");
                    request.IndustrialUnitServicesRequests.Add(
                        new IndustrialUnitServicesRequest
                        {
                            IndustrialUnitId = projectUnit.Id
                        });
                }
            }
        }

        private async Task AddAccessEngineerToDeal(Guid dealId, bool needToSaveChanges = false)
        {
            var engineers = await ApplicationContext.Users
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "Инженер-сметчик"))
                .ToListAsync();

            foreach (var engineer in engineers)
            {
                var accessAlreadyExist = await ApplicationContext.DealAccessLists.AnyAsync(da => da.DealId == dealId && da.UserId == engineer.Id);

                if (!accessAlreadyExist)
                    await ApplicationContext.DealAccessLists.AddAsync(new DealAccessList {DealId = dealId, UserId = engineer.Id});
            }

            if (needToSaveChanges)
                await ApplicationContext.SaveChangesAsync();
        }

        private async Task AddIndustrialUnitToDealIfNotExistsAsync(Guid dealId, Guid[] unitIds)
        {
            var deal = await ApplicationContext.Deals.AsNoTracking()
                .Include(d => d.IndustrialUnitDeals)
                .SingleOrDefaultAsync(d => d.Id == dealId);

            for (var i = 0; i < unitIds.Length; i++)
            {
                var unit = await ApplicationContext.Departments.FirstOrDefaultAsync(d => d.Id == unitIds[i] && d.Name != "Проектный отдел");

                var dealHasUnit = deal.IndustrialUnitDeals.Any(d => d.IndustrialUnitId == unitIds[i] && d.DealId == deal.Id);

                if (!dealHasUnit && unit != null)
                {
                    await ApplicationContext.IndustrialUnitDeals.AddAsync(new IndustrialUnitDeal { DealId = deal.Id, IndustrialUnit = unit });
                }
            }
        }

        private async Task EnsureAnswerCanBePostedAsync(Guid requestId, Guid departmentId)
        {
            var isInRequest = await ApplicationContext
                .IndustrialUnitServicesRequests
                .AnyAsync(u => u.ServicesRequestId == requestId && u.IndustrialUnitId == departmentId);

            if (!isInRequest)
                throw new InvalidOperationException("Вашего отдела нет в заявке");

            var isAnswerExist = await ApplicationContext
                .AnswersForServicesRequests
                .AnyAsync(a => a.DepartmentId == departmentId && a.ServicesRequestId == requestId);

            if (isAnswerExist)
                throw new InvalidOperationException("Ответ уже был дан");
        }

        private async Task<bool> ServicesRequestExistsAsync(Guid id)
        {
            return await ApplicationContext.ServicesRequests.AnyAsync(e => e.Id == id);
        }
    }
}
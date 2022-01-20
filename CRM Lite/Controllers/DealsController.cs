using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AutoMapper;
using CRM.API.Data;
using CRM.API.Infrastructure;
using CRM.API.Utilities;
using CRM.API.Utilities.EmailManagers;
using CRM.Data;
using CRM.Data.AuxiliaryModels;
using CRM.Data.Dtos;
using CRM.Data.Dtos.Deals;
using CRM.Data.Models;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic.FileIO;
using Newtonsoft.Json.Linq;
using Vostok.Logging.Abstractions;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/Deals")]
    [Authorize]
    public class DealsController : Controller
    {
        private readonly ApplicationContext applicationContext;
        private readonly IAccessManager accessManager;
        private readonly IBackgroundJobClient backgroundJobClient;
        private readonly IEmailDealManager emailManager;
        private readonly IWebHostEnvironment hostingEnvironment;
        private readonly IMapper mapper;
        private readonly UserManager userManager;
        private readonly ILog log;

        private readonly HashSet<string> fullAccessRoleNames = new HashSet<string>
        {
            "Администратор",
            "TOP-менеджер",
            "Менеджер по СМК"
        };

        public DealsController(
            ApplicationContext applicationContext,
            UserManager userManager,
            IAccessManager accessManager,
            IBackgroundJobClient backgroundJobClient,
            IEmailDealManager emailManager,
            IMapper mapper,
            ILog log,
            IWebHostEnvironment hostingEnvironment)
        {
            this.log = log;
            this.applicationContext = applicationContext;
            this.accessManager = accessManager;
            this.backgroundJobClient = backgroundJobClient;
            this.userManager = userManager;
            this.emailManager = emailManager;
            this.hostingEnvironment = hostingEnvironment;
            this.mapper = mapper;
        }

        [AllowAnonymous]
        [HttpGet("Search")]
        public async Task<ActionResult<DealForSupDto[]>> GetDealsLike([FromQuery] string query)
        {
            var deals = await applicationContext
                .Deals
                .Where(d => EF.Functions.ILike(d.Name, $"%{query}%"))
                .Select(
                    d => new DealForSupDto
                    {
                        Id = d.Id,
                        Name = d.Name,
                        IsClosed = d.IsClosed
                    })
                .AsNoTracking()
                .ToArrayAsync();

            return Ok(deals);
        }
        
        [AllowAnonymous]
        [HttpGet("{dealId}/Organization")]
        public async Task<ActionResult<OrganizationShortDto>> GetOrganizationByDeal(Guid dealId)
        {
            var organization = await applicationContext
                .Deals
                .Where(d => d.Id == dealId)
                .Select(d => new OrganizationShortDto
                {
                    Id = d.Organization.Id,
                    FullName = d.Organization.FullName
                })
                .AsNoTracking()
                .SingleOrDefaultAsync();

            if (organization == null)
                return NotFound();

            return Ok(organization);
        }
        
        [AllowAnonymous]
        [HttpGet("{dealId}/Name")]
        public async Task<ActionResult<string>> GetDealName(Guid dealId)
        {
            var dealName = await applicationContext
                .Deals
                .Where(d => d.Id == dealId)
                .Select(d => d.Name)
                .AsNoTracking()
                .SingleOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(dealName))
                return NotFound();

            return Ok(dealName);
        }
        
        [AllowAnonymous]
        [HttpGet("{dealId}/Responsible")]
        public async Task<ActionResult<DealResponsibleDto>> GetDealResponsibleEmployee(Guid dealId)
        {
            var responsible = await applicationContext
                .Deals
                .Where(d => d.Id == dealId)
                .Select(
                    d => new DealResponsibleDto
                    {
                        FirstName = d.ResponsibleUser.FirstName,
                        LastName = d.ResponsibleUser.LastName,
                        Email = d.ResponsibleUser.Email
                    })
                .AsNoTracking()
                .SingleOrDefaultAsync();

            if (responsible == null)
                return NotFound();

            return Ok(responsible);
        }
        
        [HttpGet("AdditionalAccess/{dealId}/{userId}")]
        public async Task<ActionResult<IReadOnlyList<Deal>>> GetDealAdditionalAccessList([FromRoute] Guid dealId, Guid userId)
        {
            var user = await applicationContext.Users
                .Include(u => u.UserRoles)
                .ThenInclude(u => u.Role)
                .SingleOrDefaultAsync(u => u.Id == userId);

            var deal = await applicationContext.Deals
                .Include(d => d.DealAdditionalAccessLists)
                    .ThenInclude(da => da.User)
                .Include(d => d.ResponsibleUser)
                    .ThenInclude(d => d.Department)
                        .ThenInclude(d => d.Manager)
                .SingleOrDefaultAsync(d => d.Id == dealId);

            var isAbleToGiveAccess =
                deal.ResponsibleUserId == user.Id || deal.ResponsibleUser?.Department?.ManagerId == user.Id ||
                user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name)) ||
                                         deal.SalesUnitDealId == user.DepartmentId && user.UserRoles.Any(ur => ur.Role.Name == "Ассистент менеджера по работе с клиентами");

            if (!isAbleToGiveAccess)
                return StatusCode(403);

            var accessList = applicationContext.DealAdditionalAccessLists
                .Include(da => da.User)
                .Where(da => da.DealId == dealId)
                .Select(da => new DealAdditionalAccessListDto
                {
                    UserId = da.User.Id,
                    UserName = da.User.DisplayName,
                    IsAbleToEdit = da.IsAbleToEdit
                });

            return Ok(accessList);
        }

        [HttpGet("Export1C")]
        [AllowAnonymous]
        public async Task<ActionResult<DealFor1cDto[]>> GetDealsFor1C(DateTime? changedTime)
        {
            var deals = await applicationContext.Deals
                .Include(c => c.ResponsibleUser)
                .Include(c => c.Organization)
                .Where(d => !changedTime.HasValue || d.ChangedDate > changedTime)
                .ToArrayAsync();

            return Ok(mapper.Map<DealFor1cDto[]>(deals));
        }

        [HttpDelete("AdditionalAccess/{dealId}/{userId}")]
        public async Task<IActionResult> DeleteAdditionalAccess([FromRoute] Guid dealId, Guid userId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await userManager.GetCurrentUserAsync();

            var deal = await applicationContext.Deals
                .Include(d => d.DealAdditionalAccessLists)
                .ThenInclude(da => da.User)
                .Include(d => d.ResponsibleUser)
                .ThenInclude(d => d.Department)
                .ThenInclude(d => d.Manager)
                .SingleOrDefaultAsync(d => d.Id == dealId);

            var isAbleToGiveAccess =
                deal.ResponsibleUserId == user.Id || deal.ResponsibleUser?.Department?.ManagerId == user.Id ||
                user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name) || ur.Role.Name == "Ассистент менеджера по работе с клиентами");

            if (!isAbleToGiveAccess)
                return StatusCode(403);

            var access = await applicationContext.DealAdditionalAccessLists
                .Where(m => m.DealId == dealId && m.UserId == userId).ToListAsync();

            if (access.Count == 0)
            {
                return NotFound();
            }

            applicationContext.DealAdditionalAccessLists.RemoveRange(access);
            await applicationContext.SaveChangesAsync();

            log.Info($"{user.DisplayName} ({user.Id}) deleted access to {userId} at deal {deal.Name} ({dealId})");

            return Ok("Deleted");
        }

        [HttpGet("Organization/{organizationId}")]
        public async Task<DealAtOrganizationDto[]> GetDealsToOrganization(Guid organizationId)
        {
            return await applicationContext.Deals
                .Include(d => d.DealStatus)
                .Include(d => d.ResponsibleUser)
                .Include(d => d.Step)
                .Where(d => d.OrganizationId == organizationId)
                .Select(
                    e => new DealAtOrganizationDto
                    {
                        Id = e.Id,
                        Name = e.Name,
                        DealStatus = e.DealStatus == null ? "" : e.DealStatus.Name,
                        ResponsibleName = e.ResponsibleUser.DisplayName,
                        Probability = e.Probability,
                        StepName = e.Step.Name,
                        EstimatedBudget = e.EstimatedBudget,
                        EstimatedMargin = e.EstimatedMargin,
                        ContractSigningDate = e.ContractSigningDate == null ? "Не указана" : e.ContractSigningDate.Value.ToShortDateString()
                    }).ToArrayAsync();
        }

        [HttpGet]
        [Route("~/api/DealsWithFourFields")]
        public JsonResult DealsWithFourFields()
        {
            return Json(
                //TODO(dstarasov): synchronous IO
                applicationContext.Deals
                    .Include(d => d.DealStatus)
                    .Include(d => d.ResponsibleUser)
                    .Select(
                        //TODO(dstarasov): anonymous type
                        e => new
                        {
                            e.Id,
                            e.Name,
                            dealStatus = e.DealStatus == null ? "" : e.DealStatus.Name,
                            responsibleName = e.ResponsibleUser.DisplayName,
                            e.Probability,
                            e.EstimatedBudget,
                            e.ContractSigningDate
                        })
                    .ToList());
        }

        [NonAction]
        private async Task<List<Guid>> GetSubordinatesGuidAsync(Guid managerId)
        {
            var list = new List<Guid>();
            var subs = await applicationContext.Users.Where(x => x.ManagerId == managerId && x.Id != managerId).Select(a => a.Id).ToListAsync();
            list.AddRange(subs);
            list.Add(managerId);
            foreach (var sub in subs)
            {
                //TODO(dstarasov): recursive IO
                var a = await GetSubordinatesGuidAsync(sub);
                list.AddRange(a);
            }
            return list;
        }

        [HttpGet]
        [Route("~/api/DealsWithFourFieldsById/{userId}")]
        public async Task<List<DealsListDto>> DealsWithFourFieldsById([FromRoute] Guid userId)
        {
            var emptyGuid = new Guid();

            var deals = await applicationContext.Deals
                .Include(x => x.DealStatus)
                .Include(x => x.Step)
                .Include(x => x.ResponsibleUser)
                .Include(x => x.Organization)
                .Include(x => x.ServicesRequests).ThenInclude(y => y.AnswersForServicesRequests).ThenInclude(a => a.ResponsiblesForAnswers)
                .Include(x => x.ProductRequests).ThenInclude(y => y.VendorsRequests)
                .Include(x => x.DealAccessLists)
                .Include(x => x.DealAdditionalAccessLists)
                .Where(x => x.DealAccessLists.Any(y => y.UserId == userId) ||
                            x.DealAdditionalAccessLists.Any(y => y.UserId == userId))
                .Select(x => new DealsListDto
                {
                    Id = x.Id,
                    IsClosed = x.IsClosed,
                    Name = x.Name,
                    DealStatus = x.DealStatus == null ? "" : x.DealStatus.Name,
                    DealStatusId = x.DealStatus == null ? emptyGuid : x.DealStatus.Id,
                    ClosureDateYear = x.ClosureDate.HasValue ? x.ClosureDate.Value.Year : 0,
                    Step = x.Step.Id,
                    StepNumber = x.Step.OrderNumber,
                    OrganizationId = x.OrganizationId,
                    OrganizationFullName = x.Organization == null ? "" : x.Organization.FullName,
                    ContactId = x.ContactId,
                    ResponsibleUserId = x.ResponsibleUserId,
                    ResponsibleProduct = string.Join(' ', x.ProductRequests.Select(l =>
                        string.Join(' ', l.VendorsRequests.Select(vr => vr.ResponsibleId))
                    )),
                    ResponsibleMP = string.Join(' ', x.ServicesRequests.Select(l =>
                        string.Join(' ', l.AnswersForServicesRequests.Select(vr =>
                            string.Join(' ', vr.ResponsiblesForAnswers.Select(r => r.ResponsibleUserId))))
                    )) + " " + x.PMId,
                    SalesDepartmentDealId = x.SalesDepartmentDealId,
                    SalesUnitDealId = x.SalesUnitDealId,
                    IndustrialDepId = x.IndustrialDepartmentDealId,
                    ChangedDate = x.ChangedDate,
                    CreatedDate = x.CreatedDate,
                    ShortName = x.ShortName,
                    ResponsibleName = x.ResponsibleUser.DisplayName,
                    Probability = x.Probability,
                    StepName = x.Step.Name,
                    EstimatedBudget = x.EstimatedBudget,
                    EstimatedMargin = x.EstimatedMargin,
                    ExpertMargin = x.EstimatedRealMargin,
                    ContractSigningDate = x.ContractSigningDate != null
                        ? x.ContractSigningDate.Value.ToShortDateString()
                        : "Неизвестная дата",
                    ContractSigningDateVal = x.ContractSigningDate ?? DateTime.MinValue
                })
                .ToListAsync();

            return deals;
        }

        [HttpGet]
        [Route("~/api/DealForKanban")]
        public JsonResult DealForKanban()
        {
            return Json(applicationContext.Deals.Include(d => d.DealStatus).Select(e => new
            {
                e.Id,
                e.Name,
                e.Step,
                e.OrganizationId,
                e.ResponsibleUserId,
                e.SalesDepartmentDealId,
                e.SalesUnitDealId,
                e.ChangedDate,
                e.CreatedDate,
                e.ShortName,
                dealStatus = e.DealStatus.Name
            }).ToList());
        }

        [HttpGet]
        [Route("~/api/DealProbability")]
        //TODO(dstarasov): JsonResult не подходящий тип для контракта API
        public JsonResult DealProbability()
        {
            var l = new Dictionary<int, string> {
                {1, "Маловероятная"},
                {2, "Вероятная"},
                {3, "Подписанная"}
            };
            return Json(l.ToList());
        }

        [HttpGet]
        [Route("~/api/PMFromDeals/{id}")]
        public async Task<ActionResult<Deal>> PMFromDeals([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var deal = await applicationContext.Deals.Where(q => q.Id == id)
                .AsNoTracking()
                .SingleOrDefaultAsync();

            if (deal == null)
                return NotFound();

            //TODO(dstarasov): структура из слоя хранения просочилась в контракт API
            return deal;
        }

        [HttpGet("{id}/{userId}")]
        public async Task<ActionResult<Deal>> GetDeal([FromRoute] Guid id, [FromRoute] Guid userId)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var deal = await applicationContext.Deals
                .Include(e => e.DealAccessLists)
                .Include(e => e.SelectionProcedure)
                .Include(e => e.IndustrialDepartmentDeal)
                .Include(e => e.SalesDepartmentDeal)
                .Include(e => e.ResponsibleUser).ThenInclude(e => e.Department).AsNoTracking()
                .Include(e => e.ProductUnitDeals).ThenInclude(sdd => sdd.ProductUnit)
                .Include(e => e.IndustrialUnitDeals).ThenInclude(sdd => sdd.IndustrialUnit)
                .Include(e => e.ProductLineDeals).ThenInclude(sdd => sdd.ProductLine)
                .Include(e => e.ProductRequests)
                .Include(e => e.ServicesRequests)
                .Include(e => e.PeopleOfInterestDeals).ThenInclude(sdd => sdd.Contact)
                .Include(e => e.Step)
                .Include(e => e.CloudLinks)
                .Include(e => e.DealStatus)
                .SingleOrDefaultAsync(m => m.Id == id);

            if (deal == null)
                return NotFound();

            var access = await accessManager.HasAccessToReadDealAsync(userId, id);

            if (!access)
                return StatusCode(403);

            return deal;
        }

        [HttpPost]
        [Route("~/api/DealName")]
        public async Task<string> GetDealName(Guid organizationId, string dealShortName, string fullDealName)
        {
            var organization = await applicationContext.Organizations.SingleOrDefaultAsync(e => e.Id == organizationId);
            var dealsCount = applicationContext.Deals.Count(e => e.OrganizationId == organization.Id).ToString("##0000");
            var dealName = "[" + organization.ShortName + "-" + dealsCount + "] - " + dealShortName ?? "";

            if (fullDealName != null && dealName != fullDealName)
                return fullDealName;

            return dealName;
        }      

        [HttpPost("Access")]
        public async Task<IActionResult> GiveAccess([FromBody] JObject accessContract)
        {
            var dealId = (Guid)accessContract.GetValue("dealId");
            var userId = (Guid)accessContract.GetValue("userId");
            var isAbleToEdit = (bool)accessContract.GetValue("isAbleToEdit");
            var usersToAccess = accessContract.GetValue("usersToAccess")[0];

            var deal = await applicationContext.Deals.AsNoTracking()
                .Include(d => d.ResponsibleUser).ThenInclude(r => r.Department)
                .SingleOrDefaultAsync(d => d.Id == dealId);

            var user = await applicationContext.Users.AsNoTracking()
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .SingleOrDefaultAsync(u => u.Id == userId);

            if (deal == null || user == null)
                return StatusCode(422);

            var isAbleToGiveAccess =
                deal.ResponsibleUserId == user.Id || deal.ResponsibleUser?.Department?.ManagerId == user.Id ||
                user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name) || ur.Role.Name == "Ассистент менеджера по работе с клиентами");

            if (!isAbleToGiveAccess)
                return StatusCode(403);

            var updateAccess = new List<DealAdditionalAccessList>();

            foreach (var userGuid in usersToAccess)
            {
                var userToAdd = await applicationContext.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == (Guid)userGuid);

                log.Info($"{user.FullName} gave access to {userToAdd.FullName} at deal {deal.Name} ({deal.Id})");

                var targetUser = applicationContext.DealAdditionalAccessLists
                    .Include(u => u.User)
                    .Where(d => d.DealId == deal.Id &&  d.UserId == userToAdd.Id).SingleOrDefault();

                if (targetUser != null)
                    if (targetUser.IsAbleToEdit != isAbleToEdit)
                        updateAccess.Add(targetUser);

                if (targetUser == null && userToAdd != null)
                {
                    await applicationContext.DealAdditionalAccessLists.AddAsync(new DealAdditionalAccessList
                    { DealId = deal.Id, UserId = userToAdd.Id, IsAbleToEdit = isAbleToEdit });
                }
            }

            await applicationContext.SaveChangesAsync();

            if (updateAccess.Count > 0)
                return StatusCode(StatusCodes.Status201Created, updateAccess );

            return StatusCode(StatusCodes.Status201Created, "success");
        }

        [HttpPost("UpdateUserAccess")]
        public async Task<IActionResult> UpdateUserAccess(AccessContractDto accessContract)
        {
            var targetUser = applicationContext.DealAdditionalAccessLists
                .Where(d => d.DealId == accessContract.dealId && d.UserId == accessContract.userId && d.IsAbleToEdit == accessContract.isAbleToEdit).SingleOrDefault();

            targetUser.IsAbleToEdit = !targetUser.IsAbleToEdit;           

            await applicationContext.SaveChangesAsync();

            return StatusCode(StatusCodes.Status201Created, "success");
        }

        [HttpPost]
        [Route("~/api/CloseDeal")]
        public async Task<IActionResult> CloseDeal([FromBody] CloseDealDto closeDealDto)
        {
            var deal = await applicationContext.Deals
                .Include(d => d.IndustrialUnitDeals)
                    .ThenInclude(iud => iud.IndustrialUnit)
                .Include(d => d.ProductUnitDeals)
                    .ThenInclude(pud => pud.ProductUnit)
                .Include(d => d.Contact)
                    .ThenInclude(c => c.ResponsibleUser)
                        .ThenInclude(r => r.Manager)
                .Include(d => d.ResponsibleUser)
                .Include(d => d.Organization)
                .Include(d => d.Step)
                .SingleOrDefaultAsync(d => d.Id == closeDealDto.CloseDealId);

            if (deal == null)
                return StatusCode(422);

            var user = await userManager.GetCurrentUserAsync();

            if (user == null)
                return StatusCode(401);

            var salesUnit = applicationContext.Departments.SingleOrDefault(d => d.Id == deal.SalesUnitDealId);
            var salesUnitManagerFromAd = salesUnit == null ? Guid.Empty :
                    salesUnit.ManagerId;

            var salesDep = applicationContext.Departments.SingleOrDefault(d => d.Id == deal.SalesDepartmentDealId);
            var salesDepManagerFromAd = salesDep == null ? Guid.Empty :
                salesDep.ManagerId;

            if (!user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name) ||
                                          ur.Role.Name == "Ассистент менеджера по работе с клиентами" ||
                                          ur.Role.Name == "Руководитель подразделения" &&
                                          (user.DepartmentId == deal.SalesDepartmentDealId || user.DepartmentId == deal.SalesUnitDealId)))
                return StatusCode(403);

            deal.CommentToFailDeal ??= closeDealDto.CloseComment;
            deal.ClosureDate = closeDealDto.CloseDate;
            deal.IsAbleToClose = true;
            deal.IsClosed = true;

            var dealWinStatus = applicationContext.DealStatus.SingleOrDefault(ds => ds.Name == "Закрытая \"Выигрыш\"");
            var dealLooseStatus = applicationContext.DealStatus.SingleOrDefault(ds => ds.Name == "Закрытая \"Потеря\"");

            if (deal.Step.OrderNumber == 7)
                deal.DealStatusToCloseId = dealWinStatus?.Id;
            else
                deal.DealStatusToCloseId = dealLooseStatus?.Id;

            var dealStatus = applicationContext.DealStatus.SingleOrDefault(ds => ds.Id == deal.DealStatusToCloseId);

            if (dealStatus == null)
                return StatusCode(500);

            log.Info($"Deal {deal.Name} ({deal.Id}) was closed");

            var href = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/Deals/Deal/" + deal.Id;

            if (dealStatus.Name == "Закрытая \"Потеря\"" && (user.Id == salesDepManagerFromAd || user.Id == salesUnitManagerFromAd))
            {
                await emailManager.SendMessageAboutCloseDeal(deal, dealStatus, closeDealDto.CloseDate, href);

                deal.DealStatus = dealStatus;
                deal.DealStatusId = dealStatus.Id;
            }
            else
            {
                await emailManager.SendMessageAboutCloseDeal(deal, dealStatus, closeDealDto.CloseDate, href);

                deal.DealStatus = dealStatus;
                deal.DealStatusId = dealStatus.Id;
            }

            await applicationContext.SaveChangesAsync();

            return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = deal.Id });
        }

        [HttpPost]
        [Route("~/api/RequestToCloseDeal")]
        public async Task<IActionResult> RequestToCloseDeal([FromBody] CloseDealDto closeDealDto)
        {
            var dealCloseStatus = applicationContext.DealStatus.SingleOrDefault(ds => ds.Name == "Закрытая \"Потеря\"");

            var deal = applicationContext.Deals
                .Include(d => d.IndustrialUnitDeals)
                    .ThenInclude(iud => iud.IndustrialUnit)
                .Include(d => d.ProductUnitDeals)
                    .ThenInclude(pud => pud.ProductUnit)
                .Include(d => d.Contact)
                    .ThenInclude(c => c.ResponsibleUser)
                        .ThenInclude(r => r.Manager)
                .Include(d => d.ResponsibleUser)
                    .ThenInclude(u => u.Manager)
                .Include(d => d.Organization)
                .SingleOrDefault(d => d.Id == closeDealDto.CloseDealId);

            if (deal == null)
            {
                log.Error($"Deal {closeDealDto.CloseDealId} was not found when requesting to close");
                return StatusCode(422);
            }

            var user = await userManager.GetCurrentUserAsync();

            if (user == null)
                return StatusCode(401);

            deal.IsAbleToClose = true;
            deal.ClosureDate = closeDealDto.CloseDate;
            deal.CommentToFailDeal = closeDealDto.CloseComment;
            deal.DealStatusToCloseId = dealCloseStatus?.Id;

            log.Info($"Deal {deal.Name} ({deal.Id}) was requested to close by {user.DisplayName} ({user.Id})");

            var href = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/Deals/Deal/" + deal.Id;

            await emailManager.SendMessageAboutRequestToCloseDeal(deal, dealCloseStatus, closeDealDto.CloseComment, closeDealDto.CloseDate, href);

            await applicationContext.SaveChangesAsync();

            return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = deal.Id });
        }

        [HttpPost]
        [Route("~/api/PutOffDeal")]
        public async Task<IActionResult> PutOffDeal(DateTime putOffDate, string putOffComment, string href, Guid putOffDealId)
        {
            var deal = applicationContext.Deals
                .Include(d => d.IndustrialUnitDeals)
                    .ThenInclude(iud => iud.IndustrialUnit)
                .Include(d => d.ProductUnitDeals)
                    .ThenInclude(pud => pud.ProductUnit)
                .Include(d => d.ResponsibleUser)
                .Include(d => d.Contact)
                    .ThenInclude(c => c.ResponsibleUser)
                        .ThenInclude(r => r.Manager)
                .Include(d => d.Organization)
                .SingleOrDefault(d => d.Id == putOffDealId);
            deal.CommentToFailDeal = putOffComment;
            deal.DateToActivate = putOffDate;

            await emailManager.SendMessageAboutPutOffDeal(deal, href);

            var dealStatus = applicationContext.DealStatus.SingleOrDefault(ds => ds.Name == "Отложенная");

            deal.DealStatus = dealStatus;
            deal.DealStatusId = dealStatus.Id;

            var user = await userManager.GetCurrentUserAsync();

            if (user == null)
                return StatusCode(401);

            log.Info($"Deal {deal.Name} ({deal.Id}) was put off by {user.DisplayName} ({user.Id})");

            await applicationContext.SaveChangesAsync();

            return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = deal.Id });
        }

        [HttpPost]
        [Route("~/api/ReopenDeal")]
        public async Task<IActionResult> ReopenDeal(Guid putOffDealId, string href)
        {
            var deal = applicationContext.Deals
                .Include(d => d.IndustrialUnitDeals)
                    .ThenInclude(iud => iud.IndustrialUnit)
                .Include(d => d.ProductUnitDeals)
                    .ThenInclude(pud => pud.ProductUnit)
                .Include(d => d.ResponsibleUser)
                .Include(d => d.Contact)
                    .ThenInclude(c => c.ResponsibleUser)
                        .ThenInclude(r => r.Manager)
                .Include(d => d.Organization)
                .SingleOrDefault(d => d.Id == putOffDealId);
            deal.CommentToFailDeal = "";
            deal.DateToActivate = DateTime.MinValue;

            var dealStatus = applicationContext.DealStatus.SingleOrDefault(ds => ds.Name == "Активная");

            await emailManager.SendMessageAboutReopenDeal(deal, href);

            deal.DealStatus = dealStatus;
            deal.DealStatusId = dealStatus.Id;

            var user = await userManager.GetCurrentUserAsync();

            if (user == null)
                return StatusCode(401);

            log.Info($"Deal {deal.Name} ({deal.Id}) was reopened by {user.DisplayName} ({user.Id})");

            await applicationContext.SaveChangesAsync();

            return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = deal.Id });
        }

        [HttpGet]
        [Route("~/api/GetWinOrLooseDealStatus")]
        public JsonResult GetWinOrLooseDealStatus()
        {
            var statuses = applicationContext.DealStatus.Where(ds => ds.Name == "Закрытая \"Потеря\"" || ds.Name == "Закрытая \"Выигрыш\"");
            return Json(statuses);
        }

        [HttpGet("DealStatuses")]
        public JsonResult GetDealStatuses()
        {
            var statuses = applicationContext.DealStatus.Select(ds => ds);
            return Json(statuses);
        }

        [HttpGet("DealSteps")]
        public JsonResult GetDealSteps()
        {
            var steps = applicationContext.Steps.Select(ds => ds);
            return Json(steps);
        }

        // POST: api/Deals
        [HttpPost]
        [Route("~/api/Deal")]
        //TODO(dstarasov): JObject слишком обобщенный тип для использования в контракте API, нужно сделать отдельную модельку
        public async Task<IActionResult> PostDeal([FromBody] JObject data)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await userManager.GetCurrentUserAsync();

            if (user == null)
                return StatusCode(401);

            var deal = await FillDeal(data, false, user);

            var access = true;

            if (applicationContext.Deals.Any(d => d.Id == deal.Id))
                access = await accessManager.HasAccessToEditDealAsync(user.Id, deal.Id);
            else
            {
                applicationContext.DealAccessLists.Add(new DealAccessList
                { DealId = deal.Id, UserId = user.Id, IsAbleToEdit = true });
            }

            if (!access)
                return StatusCode(403);

            if (!Regex.IsMatch(deal.Name, @"[а-яА-Яa-zA-Z0-9_\-\[\]]+"))
            {
                log.Error($"{user.DisplayName} ({user.Id}) ввел неверные символы в сделку {deal.Name} ({deal.Id})");
                return StatusCode(StatusCodes.Status422UnprocessableEntity);
            }

            log.Info($"Deal {deal.Name} ({deal.Id}) was saved by {user.DisplayName} ({user.Id})");

            await applicationContext.SaveChangesAsync();

            backgroundJobClient.Enqueue(() => accessManager.UpdateAccessAsync(deal.Id, true));

            return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = deal.Id });
        }

        [HttpPost]
        [Route("~/api/ExpressDeal")]
        public async Task<IActionResult> ExpressPostDeal([FromBody] JObject data)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await userManager.GetCurrentUserAsync();

            if (user == null)
                return StatusCode(401);

            Deal deal = await FillDeal(data, true, user);

            if (!applicationContext.Deals.Any(d => d.Id == deal.Id))
            {
                applicationContext.DealAccessLists.Add(new DealAccessList
                { DealId = deal.Id, UserId = user.Id, IsAbleToEdit = true });
            }

            if (!Regex.IsMatch(deal.Name, @"[а-яА-Яa-zA-Z0-9_\-\[\]]+"))
            {
                log.Error($"{user.DisplayName} ({user.Id}) ввел неверные символы в сделку {deal.Name} ({deal.Id})");
                return StatusCode(StatusCodes.Status422UnprocessableEntity);
            }

            log.Info($"Deal {deal.Name} ({deal.Id}) was moved expressed by {user.DisplayName} ({user.Id})");

            await applicationContext.SaveChangesAsync();

            backgroundJobClient.Enqueue(() => accessManager.UpdateAccessAsync(deal.Id, true));

            return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = deal.Id });
        }

        private async Task<Deal> FillDeal(JObject data, bool isExpress, User creatorUser)
        {
            var stepNumber = 1;

            var stepId = (string)data.GetValue("stepId");
            var nextStep = (bool)data.GetValue("nextStep");

            if (stepId != "")
            {
                var currentStep = applicationContext.Steps.FirstOrDefault(b => b.Name == stepId);
                stepNumber = currentStep.OrderNumber;
            }

            if (nextStep && await ChangeStep(stepNumber, data))
                stepNumber++;

            if (isExpress && await ChangeStep(1, data))
                stepNumber = 5;

            var step = applicationContext.Steps.FirstOrDefault(b => b.OrderNumber == stepNumber);

            var statusName = step.OrderNumber == 7 ? "Закрытая \"Выигрыш\"" : "Активная";
            var statusNameToCloseDeal = step.OrderNumber == 7 ? "Закрытая \"Выигрыш\"" : "";

            var statusToCloseDeal = applicationContext.DealStatus
                .FirstOrDefault(ds => ds.Name == statusNameToCloseDeal);

            var status = applicationContext.DealStatus
                .FirstOrDefault(ds => ds.Name == statusName);

            var deal = string.IsNullOrEmpty((string)data.GetValue("id")) ?
                    new Deal() :
                    await applicationContext.Deals.SingleOrDefaultAsync(d => d.Id == (Guid?)data.GetValue("id"));

            deal.DealStatusToCloseId = statusToCloseDeal?.Id;

            deal.DealStatus = status ?? throw new Exception();
            deal.DealStatusId = deal.DealStatus.Id;
            deal.Step = step;
            deal.StepId = deal.Step.Id;
            deal.ShortName = (string)data.GetValue("shortName") ?? throw new Exception();

            deal.Probability = GetProbability(step.OrderNumber);
            deal.ResponsibleUserId = (Guid)data.GetValue("responsibleUserId");

            deal.IsProbable = nextStep ? GetProbabilityForNextStep(step.OrderNumber) : (string)data.GetValue("isProbable");

            deal.HintVerificationStepClientsTasksAndNeeds = (string)data.GetValue("hintVerificationStepClientsTasksAndNeeds");
            deal.ContactId = (Guid?)data.GetValue("contactId");

            deal.IsMergedFromInterest = false;

            deal.OrganizationId = (Guid?)data.GetValue("organizationId") ?? throw new Exception();
            deal.DecisionMakerId = (Guid?)data.GetValue("decisionMakerId");
            deal.Competitors = (string)data.GetValue("competitors") ?? "";
            deal.DealTypeId = (Guid?)data.GetValue("dealTypeId");
            deal.IsRecurring = (bool)data.GetValue("isRecurring");
            deal.DecisionMakerId = (Guid?)data.GetValue("decisionMakerId");

            var salesDepartmentsArray = data.GetValue("salesDepartmentsIds").ToArray();
            var industrialDepartmentArray = data.GetValue("industrialDepartmentsIds").ToArray();
            var salesUnitArray = data.GetValue("salesUnitsIds").ToArray();

            List<Guid> salesDepartmentList = (string)salesDepartmentsArray[0] != null ? new List<Guid> { (Guid)salesDepartmentsArray[0] } : null;
            List<Guid> industrialDepartmentList = (string)industrialDepartmentArray[0] != null ? new List<Guid> { (Guid)industrialDepartmentArray[0] } : null;
            List<Guid> salesUnitList = (string)salesUnitArray[0] != null ? new List<Guid> { (Guid)salesUnitArray[0] } : null;

            deal.SalesDepartmentDealId = salesDepartmentList?.FirstOrDefault();
            deal.IndustrialDepartmentDealId = industrialDepartmentList?.FirstOrDefault();
            deal.SalesUnitDealId = salesUnitList?.FirstOrDefault();

            if ((string)data.GetValue("contractSigningDate") != "")
                deal.ContractSigningDate = (DateTime)data.GetValue("contractSigningDate");

            deal.EstimatedBudget = (double)data.GetValue("estimatedBudget");

            if ((double)data.GetValue("hintContractSignedStepDealAmount") != 0.00)
            {
                deal.EstimatedBudget = (double)data.GetValue("hintContractSignedStepDealAmount");
            }

            var selectionProcedureId = (string)data.GetValue("selectionProcedureId");
            if (string.IsNullOrEmpty(selectionProcedureId))
                deal.SelectionProcedureId = null;
            else
                deal.SelectionProcedureId = Guid.Parse(selectionProcedureId);

            deal.ChangedDate = DateTime.Now;
            //step2
            deal.HintDevelopmentStepDefineWorkGroup = (bool)data.GetValue("hintDevelopmentStepDefineWorkGroup");
            deal.HintDevelopmentStepDefineVendors = (bool)data.GetValue("hintDevelopmentStepDefineVendors");
            deal.HintDevelopmentStepFillInProductionClaim = (bool)data.GetValue("hintDevelopmentStepFillInProductionClaim");
            deal.HintDevelopmentStepRegisterProjectWithVendor = (bool)data.GetValue("hintDevelopmentStepRegisterProjectWithVendor");
            deal.HintDevelopmentStepWorkThroughSpecialPricesMechanism = (bool)data.GetValue("hintDevelopmentStepWorkThroughSpecialPricesMechanism");
            deal.HintDevelopmentStepRequestSpecialPricesFromVendor = (bool)data.GetValue("hintDevelopmentStepRequestSpecialPricesFromVendor");
            deal.HintDevelopmentStepLayoutProject = (bool)data.GetValue("hintDevelopmentStepLayoutProject");
            deal.HintDevelopmentStepDevelopTKP = (bool)data.GetValue("hintDevelopmentStepDevelopTKP");

            if ((string)data.GetValue("contractClosureDate") != "")
                deal.ContractClosureDate = (DateTime)data.GetValue("contractClosureDate");

            deal.EstimatedMargin = (double)data.GetValue("estimatedMargin");
            deal.EstimatedRealMargin = (double)data.GetValue("estimatedRealMargin");

            //step 3
            deal.HintNegotiatingStepMeetingWithCustomer = (bool)data.GetValue("hintNegotiatingStepMeetingWithCustomer");
            deal.HintNegotiatingStepApproveSpecificationWithCustomer = (bool)data.GetValue("hintNegotiatingStepApproveSpecificationWithCustomer");
            deal.HintNegotiatingStepApproveSolutionArchitectureWithCustomer = (bool)data.GetValue("hintNegotiatingStepApproveSolutionArchitectureWithCustomer");
            deal.HintNegotiatingStepWorkThroughObjections = (bool)data.GetValue("hintNegotiatingStepWorkThroughObjections");
            deal.HintNegotiatingStepMeetingWithCustomer = (bool)data.GetValue("hintNegotiatingStepMeetingWithCustomer");
            deal.HintNegotiatingStepApproveSpecificationWithCustomer = (bool)data.GetValue("hintNegotiatingStepApproveSpecificationWithCustomer");
            deal.HintNegotiatingStepApproveSolutionArchitectureWithCustomer = (bool)data.GetValue("hintNegotiatingStepApproveSolutionArchitectureWithCustomer");
            deal.HintNegotiatingStepWorkThroughObjections = (bool)data.GetValue("hintNegotiatingStepWorkThroughObjections");
            deal.HintNegotiatingStepGetSpecialPricesFromVendor = (bool)data.GetValue("hintNegotiatingStepGetSpecialPricesFromVendor");
            deal.HintNegotiatingStepLayoutUpdating = (bool)data.GetValue("hintNegotiatingStepLayoutUpdating");
            deal.HintNegotiatingStepWorkThroughDefenseMechanisms = (bool)data.GetValue("hintNegotiatingStepWorkThroughDefenseMechanisms");
            deal.HintNegotiatingStepWorkThroughTZ = (bool)data.GetValue("hintNegotiatingStepWorkThroughTZ");

            //step4
            deal.HintContestStepCompetitorsOffersWorkedThrough = data.Value<bool>("hintContestStepCompetitorsOffersWorkedThrough");
            deal.HintContestStepContestClaim = (bool)data.GetValue("hintContestStepContestClaim");
            deal.HintContestStepGetContestDocs = (bool)data.GetValue("hintContestStepGetContestDocs");
            deal.HintContestStepGetSpecialPrices = (bool)data.GetValue("hintContestStepGetSpecialPrices");
            deal.HintContestStepLayoutWithRisks = (bool)data.GetValue("hintContestStepLayoutWithRisks");
            deal.HintContestStepNotifyHostTeam = (bool)data.GetValue("hintContestStepNotifyHostTeam");
            deal.HintContestStepNotifyVendorsTeam = (bool)data.GetValue("hintContestStepNotifyVendorsTeam");
            deal.HintContestStepSupplyConditions = (bool)data.GetValue("hintContestStepSupplyConditions");

            if ((string)data.GetValue("procurementProcedureResultsDate") != "")
                deal.ProcurementProcedureResultsDate = (DateTime)data.GetValue("procurementProcedureResultsDate");

            //step5
            deal.HintContractSignedStepApproveProjectWithVendor = (bool)data.GetValue("hintContractSignedStepApproveProjectWithVendor");
            deal.HintContractSignedStepCheckSigningProcedureFormat = (bool)data.GetValue("hintContractSignedStepCheckSigningProcedureFormat");
            deal.HintContractSignedStepFormatSaleIn1C = (bool)data.GetValue("hintContractSignedStepFormatSaleIn1C");
            deal.HintContractSignedStepGetAndPassProvision = (bool)data.GetValue("hintContractSignedStepGetAndPassProvision");
            deal.HintContractSignedStepPassClaimForService = (bool)data.GetValue("hintContractSignedStepPassClaimForService");
            deal.HintContractSignedStepUpdateDataInSystems = (bool)data.GetValue("hintContractSignedStepUpdateDataInSystems");
            deal.AmountOfDeal = (double)data.GetValue("hintContractSignedStepDealAmount");

            ///6
            deal.HintContractWorksStepDiscussProject = (bool)data.GetValue("hintContractWorksStepDiscussProject");
            deal.HintContractWorksStepInternalProjectReference = (bool)data.GetValue("hintContractWorksStepInternalProjectReference");
            deal.HintContractWorksStepPassDocsToAccounting = (bool)data.GetValue("hintContractWorksStepPassDocsToAccounting");
            deal.HintContractWorksStepPaymentControl = (bool)data.GetValue("hintContractWorksStepPaymentControl");
            deal.HintContractWorksStepSupplyMonitoring = (bool)data.GetValue("hintContractWorksStepSupplyMonitoring");

            var organization = await applicationContext.Organizations
                .Where(o => o.Id == deal.OrganizationId)
                .Select(o => o).FirstOrDefaultAsync();

            if (string.IsNullOrEmpty((string)data.GetValue("name")))
            {
                deal.CreatedDate = DateTime.Now;
                var dealsCount = (applicationContext.Deals.Count(e => e.OrganizationId == organization.Id) + 1).ToString("##0000");
                deal.Name = "[" + organization.ShortName + "-" + dealsCount + "] - " + deal.ShortName.Trim() ?? "";

                var dealNameParts = deal.Name.Trim().Split("] - ", 2);
                deal.ShortName = dealNameParts[1];

                applicationContext.Deals.Add(deal);

                log.Info($"Deal was created with name: {deal.Name} ({deal.Id}) by user: {creatorUser.DisplayName} ({creatorUser.Id})");
            }
            else if (((string)data.GetValue("name")).Trim() != deal.Name)
            {
                var dealNameParts = ((string)data.GetValue("name")).Trim().Split("] - ", 2);

                if (dealNameParts.Length < 2)
                    throw new Exception($"Ошибка в имени сделки. Id сделки: {deal.Id} user: {creatorUser.DisplayName} ({creatorUser.Id})");

                try
                {
                    RenameDealDirectory(deal.Name, (string)data.GetValue("name"), creatorUser);
                }
                catch (Exception e)
                {
                    log.Error($"Ошибка в переименовании файла в сделке с id: {deal.Id} user: {creatorUser.DisplayName} ({creatorUser.Id})");
                    log.Error(e.InnerException);
                    throw;
                }

                deal.ShortName = dealNameParts[1];

                deal.Name = ((string)data.GetValue("name")).Trim();

                log.Info($"Deal {deal.Id} was renamed to {deal.Name} by user: {creatorUser.DisplayName} ({creatorUser.Id})");
            }

            var oldTimeInterval = await applicationContext.PurchaseTimeIntervals.SingleOrDefaultAsync(t => t.Id == deal.PurchaseTimeIntervalId);
            var newTimeInterval = await applicationContext.PurchaseTimeIntervals.SingleOrDefaultAsync(t => t.Id == (Guid?)data.GetValue("purchaseTimeIntervalId"));

            if (oldTimeInterval?.Name != "Бюджетирование на будущие годы" && newTimeInterval?.Name == "Бюджетирование на будущие годы")
            {
                deal.Name = deal.Name.Insert(deal.Name.IndexOf("] -") + 1, " [БЮДЖЕТ]");
                deal.ShortName = deal.ShortName.Insert(deal.ShortName.IndexOf("] -") + 1, " [БЮДЖЕТ]");
            }

            if (newTimeInterval?.Name != "Бюджетирование на будущие годы" && oldTimeInterval?.Name == "Бюджетирование на будущие годы")
            {
                deal.Name = deal.Name.Replace(" [БЮДЖЕТ]", "");
                deal.ShortName = deal.ShortName.Replace(" [БЮДЖЕТ]", "");
            }

            deal.PurchaseTimeIntervalId = (Guid?)data.GetValue("purchaseTimeIntervalId");

            await EditCloudLinksAsync(data, deal);
            await EditMultipleFieldsAsync(data, deal);
            if (step.OrderNumber == 7)
            {
                deal.ClosureDate = (DateTime)data.GetValue("closureDate");
                await CloseDeal(new CloseDealDto {CloseDealId = deal.Id, CloseComment = "", CloseDate = deal.ClosureDate.GetValueOrDefault()});
            }

            return deal;
        }

        private string GetProbabilityForNextStep(int stepOrderNumber)
        {
            return stepOrderNumber switch
            {
                1 => "1",
                2 => "1",
                3 => "2",
                4 => "2",
                _ => "3"
            };
        }

        public void RenameDealDirectory(string oldName, string newName, User creatorUser)
        {
            var oldDealNameFixed = FilesController.FixInvalidChars(new StringBuilder(oldName), '-');
            var newDealNameFixed = FilesController.FixInvalidChars(new StringBuilder(newName), '-');

            if (string.IsNullOrWhiteSpace(newDealNameFixed) || !Regex.IsMatch(newDealNameFixed, @"[а-яА-Яa-zA-Z0-9_\-\[\]]+"))
            {
                log.Error($"Введено пустое или неверное название сделки user: {creatorUser.DisplayName} ({creatorUser.Id})");
                throw new Exception("Введено пустое или неверное название сделки");
            }

            var oldDirectoryPath = Path.Combine(
                hostingEnvironment.WebRootPath,
                "uploads",
                oldDealNameFixed);

            var newDirectoryPath = Path.Combine(
                hostingEnvironment.WebRootPath,
                "uploads",
                newDealNameFixed);

            if (Directory.Exists(newDirectoryPath))
            {
                Directory.Delete(newDirectoryPath, true);
                log.Info($"Directory {newDealNameFixed} was deleted by user: {creatorUser.DisplayName} ({creatorUser.Id})");
            }

            if (Directory.Exists(oldDirectoryPath))
            {
                FileSystem.RenameDirectory(oldDirectoryPath, newDealNameFixed);
                log.Info($"Deal renamed from {oldDealNameFixed} to {newDealNameFixed} by user: {creatorUser.DisplayName} ({creatorUser.Id})");
            }
        }

        [HttpGet("GetStatements")]
        public async Task<ActionResult<List<StatementDto>>> GetStatements(bool isPlan = false)
        {
            var user = await userManager.GetCurrentUserAsync();

            var isManagerOfProjectDep =
                await applicationContext.Departments.AnyAsync(d => d.Name.Contains("Проектный") && d.ManagerId == user.Id);

            var userRoleNames = applicationContext.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ur.UserId == user.Id)
                .Select(ur => ur.Role.Name).ToHashSet();

            if (userRoleNames.Contains("TOP-менеджер") ||
                userRoleNames.Contains("Менеджер по СМК") ||
                userRoleNames.Contains("Администратор"))
            {
                return await applicationContext.Deals
                    .Include(x => x.DealStatus)
                    .Include(x => x.ResponsibleUser)
                    .Include(d => d.Organization)
                    .Include(d => d.SalesUnitDeal)
                    .Include(d => d.PurchaseTimeInterval)
                    .Include(d => d.Step)
                    .Include(d => d.SalesDepartmentDeal)
                    .Include(d => d.ProductLineDeals)
                    .ThenInclude(d => d.ProductLine)
                    .Where(x => x.DealStatus.Name == "Активная" &&
                                (!isPlan || x.PurchaseTimeInterval == null ||
                                 x.PurchaseTimeInterval != null && x.PurchaseTimeInterval.Name != "Бюджетирование на будущие годы"))
                    .Select(x => new StatementDto
                    {
                        salesUnitName = x.SalesUnitDeal == null ? "" : x.SalesUnitDeal.Name,
                        responsibleName = x.ResponsibleUser.DisplayName,
                        organizationName = x.Organization == null ? "" : x.Organization.ShortName,
                        dealName = x.Name,
                        shortDealName = x.ShortName,
                        productLineName = string.Join(' ', x.ProductLineDeals.Select(l => l.ProductLine.Name)),
                        stepName = x.Step == null ? "" : x.Step.Name,
                        dealStatusName = x.DealStatus == null ? "" : x.DealStatus.Name,
                        creationDate = x.CreatedDate == DateTime.MinValue ? "" : x.CreatedDate.ToShortDateString(),
                        contractSigningDate = x.ContractSigningDate == null
                            ? ""
                            : x.ContractSigningDate.Value.ToShortDateString(),
                        contractClosureDate = x.ContractClosureDate == null
                            ? ""
                            : x.ContractClosureDate.Value.ToShortDateString(),
                        changedDate = x.ChangedDate == DateTime.MinValue ? "" : x.ChangedDate.ToShortDateString(),
                        salesDepartmentName = x.SalesDepartmentDeal == null ? "" : x.SalesDepartmentDeal.Name,
                        industrialDepartmentName = x.IndustrialDepartmentDeal == null ? "" : x.IndustrialDepartmentDeal.Name,
                        probability = x.Probability ?? 0,
                        estimatedBudget = x.EstimatedBudget ?? 0,
                        estimatedMargin = x.EstimatedMargin ?? 0,
                        estimatedRealMargin = x.EstimatedRealMargin ?? 0,
                        enterBudget = x.EstimatedBudget - x.EstimatedMargin < 0
                            ? 0
                            : x.EstimatedBudget - x.EstimatedMargin,
                        averageMargin = x.EstimatedMargin * x.Probability / 100 < 0
                            ? 0
                            : x.EstimatedMargin * x.Probability / 100,
                        dealClassName = x.IsProbable == null ? "" : GetProbability(x.IsProbable)
                    })
                    .ToListAsync();
            }

            var subs = new List<Guid> { user.Id };

            if (userRoleNames.Contains("Ассистент менеджера по работе с клиентами"))
            {
                if (user.ManagerId != null)
                    subs = await GetSubordinatesGuidAsync((Guid)user.ManagerId);

                return await GetDealStatementsForHeadManagersToListAsync(subs, isPlan);
            }

            if (isManagerOfProjectDep && user.Department?.ParentDepartment?.ManagerId != null)
            {
                subs = await GetSubordinatesGuidAsync((Guid)user.Department?.ParentDepartment?.ManagerId);
            }

            if (userRoleNames.Contains("Руководитель подразделения") ||
            userRoleNames.Contains("Руководитель офиса продаж"))
            {
                subs = await GetSubordinatesGuidAsync(user.Id);

                return await GetDealStatementsForHeadManagersToListAsync(subs, isPlan);
            }

            return await applicationContext.Deals
                .Include(x => x.DealStatus)
                .Include(x => x.ResponsibleUser)
                .Include(d => d.SalesUnitDeal)
                .Include(d => d.Step)
                .Include(d => d.SalesDepartmentDeal)
                .Include(d => d.ProductLineDeals)
                .ThenInclude(d => d.ProductLine)
                .Include(x => x.ServicesRequests).ThenInclude(y => y.AnotherResponsiblesServicesRequests)
                .Include(x => x.ServicesRequests).ThenInclude(y => y.IndustrialUnitServicesRequests)
                .ThenInclude(z => z.IndustrialUnit)
                .Include(x => x.Contact)
                .Include(x => x.PM)
                .Include(x => x.ProductRequests).ThenInclude(y => y.AnotherResponsiblesProductRequest)
                .Include(x => x.ProductRequests).ThenInclude(y => y.VendorsRequests)
                .Include(x => x.Organization).ThenInclude(x => x.MainContact)
                .Include(x => x.DealAccessLists)
                .Where(x =>
                    subs.Contains(x.ResponsibleUserId) && x.DealStatus.Name == "Активная" &&
                    (!isPlan || x.PurchaseTimeInterval == null ||
                     x.PurchaseTimeInterval != null && x.PurchaseTimeInterval.Name != "Бюджетирование на будущие годы"))
                .Select(x => new StatementDto
                {
                    salesUnitName = x.SalesUnitDeal == null ? "" : x.SalesUnitDeal.Name,
                    responsibleName = x.ResponsibleUser.DisplayName,
                    organizationName = x.Organization == null ? "" : x.Organization.ShortName,
                    dealName = x.Name,
                    shortDealName = x.ShortName,
                    productLineName = string.Join(' ', x.ProductLineDeals.Select(l => l.ProductLine.Name)),
                    stepName = x.Step == null ? "" : x.Step.Name,
                    dealStatusName = x.DealStatus == null ? "" : x.DealStatus.Name,
                    creationDate = x.CreatedDate == DateTime.MinValue ? "" : x.CreatedDate.ToShortDateString(),
                    contractSigningDate = x.ContractSigningDate == null
                            ? ""
                            : x.ContractSigningDate.Value.ToShortDateString(),
                    contractClosureDate = x.ContractClosureDate == null
                            ? ""
                            : x.ContractClosureDate.Value.ToShortDateString(),
                    changedDate = x.ChangedDate == DateTime.MinValue ? "" : x.ChangedDate.ToShortDateString(),
                    salesDepartmentName = x.SalesDepartmentDeal == null ? "" : x.SalesDepartmentDeal.Name,
                    industrialDepartmentName = x.IndustrialDepartmentDeal == null ? "" : x.IndustrialDepartmentDeal.Name,
                    probability = x.Probability ?? 0,
                    estimatedBudget = x.EstimatedBudget ?? 0,
                    estimatedMargin = x.EstimatedMargin ?? 0,
                    estimatedRealMargin = x.EstimatedRealMargin ?? 0,
                    enterBudget = x.EstimatedBudget - x.EstimatedMargin < 0
                            ? 0
                            : x.EstimatedBudget - x.EstimatedMargin,
                    averageMargin = x.EstimatedMargin * x.Probability / 100 < 0
                            ? 0
                            : x.EstimatedMargin * x.Probability / 100,
                    dealClassName = x.IsProbable == null ? "" : GetProbability(x.IsProbable)
                })
                .ToListAsync();
        }

        private async Task<List<StatementDto>> GetDealStatementsForHeadManagersToListAsync(List<Guid> subs, bool isPlan = false)
        {
            return await applicationContext.Deals
                .Include(x => x.ServicesRequests).ThenInclude(y => y.AnotherResponsiblesServicesRequests)
                .Include(x => x.ServicesRequests).ThenInclude(y => y.IndustrialUnitServicesRequests).ThenInclude(z => z.IndustrialUnit)
                .Include(x => x.Contact)
                .Include(x => x.DealStatus)
                .Include(x => x.ResponsibleUser)
                .Include(x => x.ProductRequests).ThenInclude(y => y.AnotherResponsiblesProductRequest)
                .Include(x => x.ProductRequests).ThenInclude(y => y.VendorsRequests)
                .Include(x => x.Organization).ThenInclude(x => x.MainContact)
                .Include(x => x.IndustrialUnitDeals).ThenInclude(x => x.IndustrialUnit)
                .Include(x => x.ProductUnitDeals).ThenInclude(x => x.ProductUnit)
                .Include(x => x.DealAccessLists)
                .Where(x =>
                    subs.Contains(x.ResponsibleUserId) && x.DealStatus.Name == "Активная" && (!isPlan || x.PurchaseTimeInterval.Name != "Бюджетирование на будущие годы"))
                .Select(x => new StatementDto
                {
                    salesUnitName = x.SalesUnitDeal == null ? "" : x.SalesUnitDeal.Name,
                    responsibleName = x.ResponsibleUser.DisplayName,
                    organizationName = x.Organization == null ? "" : x.Organization.ShortName,
                    dealName = x.Name,
                    shortDealName = x.ShortName,
                    productLineName = string.Join(' ', x.ProductLineDeals.Select(l => l.ProductLine.Name)),
                    stepName = x.Step == null ? "" : x.Step.Name,
                    dealStatusName = x.DealStatus == null ? "" : x.DealStatus.Name,
                    creationDate = x.CreatedDate == DateTime.MinValue ? "" : x.CreatedDate.ToShortDateString(),
                    contractSigningDate = x.ContractSigningDate == null
                            ? ""
                            : x.ContractSigningDate.Value.ToShortDateString(),
                    contractClosureDate = x.ContractClosureDate == null
                            ? ""
                            : x.ContractClosureDate.Value.ToShortDateString(),
                    changedDate = x.ChangedDate == DateTime.MinValue ? "" : x.ChangedDate.ToShortDateString(),
                    salesDepartmentName = x.SalesDepartmentDeal == null ? "" : x.SalesDepartmentDeal.Name,
                    industrialDepartmentName = x.IndustrialDepartmentDeal == null ? "" : x.IndustrialDepartmentDeal.Name,
                    probability = x.Probability ?? 0,
                    estimatedBudget = x.EstimatedBudget ?? 0,
                    estimatedMargin = x.EstimatedMargin ?? 0,
                    estimatedRealMargin = x.EstimatedRealMargin ?? 0,
                    enterBudget = x.EstimatedBudget - x.EstimatedMargin < 0
                            ? 0
                            : x.EstimatedBudget - x.EstimatedMargin,
                    averageMargin = x.EstimatedMargin * x.Probability / 100 < 0
                            ? 0
                            : x.EstimatedMargin * x.Probability / 100,
                    dealClassName = x.IsProbable == null ? "" : GetProbability(x.IsProbable),
                    comments = ""
                })
                .ToListAsync();
        }

        [HttpGet("GetSalesHole")]
        public async Task<ActionResult<SalesHoleDto[]>> GetSalesHoleAsync([FromQuery] bool isPlan = false, string salesUnit = "")
        {
            var user = await userManager.GetCurrentUserAsync();

            var managedDepartment = await applicationContext.Departments
                .Include(d => d.ChildDepartments)
                .FirstOrDefaultAsync(d => d.IsActive && !d.ParentDepartmentId.HasValue && d.ManagerId == user.Id);

            if (managedDepartment != null)
            {
                if (string.IsNullOrEmpty(salesUnit))
                {
                    salesUnit = managedDepartment.ChildDepartments
                        .Where(d => d.CanSell && d.IsActive)
                        .Aggregate("", (s, department) => s + department.Name);
                }
            }

            var isManagerOfProjectDep =
                await applicationContext.Departments.AnyAsync(d => d.Name.Contains("Проектный") && d.ManagerId == user.Id);

            var userRoleNames = applicationContext.UserRoles
                .Where(ur => ur.UserId == user.Id)
                .Select(ur => ur.Role.Name).ToHashSet();

            if (userRoleNames.Contains("TOP-менеджер") ||
                userRoleNames.Contains("Менеджер по СМК") ||
                userRoleNames.Contains("Администратор"))
            {
                return await applicationContext.Deals
                    .Where(x => x.DealStatus.Name == "Активная" && x.EstimatedRealMargin.HasValue && (string.IsNullOrWhiteSpace(salesUnit) || salesUnit.Contains(x.SalesUnitDeal.Name)) &&
                                (!isPlan || x.PurchaseTimeInterval == null ||
                                 x.PurchaseTimeInterval != null && x.PurchaseTimeInterval.Name != "Бюджетирование на будущие годы"))
                    .GroupBy(x => x.IsProbable)
                    .Select(x => new SalesHoleDto
                    {
                        Probability = GetProbability(x.Key),
                        RealMarginSum = Math.Round(x.Sum(d => (double)d.EstimatedRealMargin) / 1.2, 0)
                    })
                    .ToArrayAsync();
            }

            var subs = new List<Guid> { user.Id };

            if (userRoleNames.Contains("Ассистент менеджера по работе с клиентами") && user.ManagerId != null)
            {
                subs = await GetSubordinatesGuidAsync((Guid)user.ManagerId);
            }

            if (isManagerOfProjectDep && user.Department?.ParentDepartment?.ManagerId != null)
            {
                subs = await GetSubordinatesGuidAsync((Guid)user.Department?.ParentDepartment?.ManagerId);
            }

            if (userRoleNames.Contains("Руководитель подразделения") ||
            userRoleNames.Contains("Руководитель офиса продаж"))
            {
                subs = await GetSubordinatesGuidAsync(user.Id);
            }

            return await applicationContext.Deals
                .Where(x => x.DealStatus.Name == "Активная" &&
                            (user.Department.CanProduct && x.ProductRequests.Any(pr => pr.VendorsRequests.Any(vr => subs.Contains(vr.ResponsibleId))) ||
                            subs.Contains(x.ResponsibleUserId)) && x.EstimatedRealMargin.HasValue && (string.IsNullOrWhiteSpace(salesUnit) || salesUnit.Contains(x.SalesUnitDeal.Name)) &&
                            (!isPlan || x.PurchaseTimeInterval == null ||
                             x.PurchaseTimeInterval != null && x.PurchaseTimeInterval.Name != "Бюджетирование на будущие годы"))
                .GroupBy(x => x.IsProbable)
                .Select(x => new SalesHoleDto
                {
                    Probability = GetProbability(x.Key),
                    RealMarginSum = Math.Round(x.Sum(d => (double)d.EstimatedRealMargin) / 1.2, 0)
                })
                .ToArrayAsync();
        }

        [HttpGet("GetStartPageKanbanDeals")]
        public async Task<ActionResult<KanbanStartPageDealsDto[]>> GetStartPageKanbanDealsAsync([FromQuery] string salesUnit = "")
        {
            var user = await userManager.GetCurrentUserAsync();
            var managedDepartment = await applicationContext.Departments
                .Include(d => d.ChildDepartments)
                .FirstOrDefaultAsync(d => d.IsActive && !d.ParentDepartmentId.HasValue && d.ManagerId == user.Id);

            if (managedDepartment != null)
            {
                if (string.IsNullOrEmpty(salesUnit))
                {
                    salesUnit = managedDepartment.ChildDepartments
                        .Where(d => d.CanSell && d.IsActive)
                        .Aggregate("", (s, department) => s + department.Name);
                }
            }

            var isManagerOfProjectDep =
                await applicationContext.Departments.AnyAsync(d => d.Name.Contains("Проектный") && d.ManagerId == user.Id);

            var userRoleNames = applicationContext.UserRoles
                .Where(ur => ur.UserId == user.Id)
                .Select(ur => ur.Role.Name).ToHashSet();

            if (userRoleNames.Contains("TOP-менеджер") ||
                userRoleNames.Contains("Менеджер по СМК") ||
                userRoleNames.Contains("Администратор"))
            {
                if (string.IsNullOrEmpty(salesUnit))
                {
                    var allSalesUnits = await applicationContext.Departments
                        .Where(d => d.CanSell && (d.ParentDepartment.Name == "ДИС" || d.ParentDepartment.Name == "ДВС") && d.IsActive)
                        .Select(u => u.Name)
                        .ToListAsync();

                    var allTopUserDeals = new List<KanbanStartPageForGroupingDto>();

                    foreach (var salesUnitName in allSalesUnits)
                    {
                        var depUserDeals = await GetKanbanDtosForGroupingForTopAsync(salesUnitName);
                        allTopUserDeals.AddRange(depUserDeals);
                    }

                    return allTopUserDeals
                        .GroupBy(x => new { x.SaleId, x.SaleName })
                        .Select(
                            x => new KanbanStartPageDealsDto
                            {
                                SaleName = x.Key.SaleName,
                                SaleId = x.Key.SaleId,
                                IsProduct = false,
                                IsLogistics = false,
                                VerificationDealsCount = x.Count(d => d.StepNumber == 1 && d.DealIsActive),
                                DevelopmentDealsCount = x.Count(d => d.StepNumber == 2 && d.DealIsActive),
                                NegotiatingDealsCount = x.Count(d => d.StepNumber == 3 && d.DealIsActive),
                                ContestDealsCount = x.Count(d => d.StepNumber == 4 && d.DealIsActive),
                                SignDealsCount = x.Count(d => d.StepNumber == 5 && d.DealIsActive),
                                WorkDealsCount = x.Count(d => d.StepNumber == 6 && d.DealIsActive),
                                ClosedDealsCount = x.Count(d => d.StepNumber == 7 && 
                                                                d.ClosureDate.HasValue && d.ClosureDate.Value.Year == DateTime.Now.Year)
                            })
                        .Where(DoesKanBanDealDtoHaveDeals)
                        .ToArray();
                }
                
                var topUserDeals = await GetKanbanDtosForGroupingForTopAsync(salesUnit);

                return topUserDeals
                    .GroupBy(x => new { x.SaleId, x.SaleName })
                    .Select(
                        x => new KanbanStartPageDealsDto
                        {
                            SaleName = x.Key.SaleName,
                            SaleId = x.Key.SaleId,
                            IsProduct = false,
                            IsLogistics = false,
                            VerificationDealsCount = x.Count(d => d.StepNumber == 1 && d.DealIsActive),
                            DevelopmentDealsCount = x.Count(d => d.StepNumber == 2 && d.DealIsActive),
                            NegotiatingDealsCount = x.Count(d => d.StepNumber == 3 && d.DealIsActive),
                            ContestDealsCount = x.Count(d => d.StepNumber == 4 && d.DealIsActive),
                            SignDealsCount = x.Count(d => d.StepNumber == 5 && d.DealIsActive),
                            WorkDealsCount = x.Count(d => d.StepNumber == 6 && d.DealIsActive),
                            ClosedDealsCount = x.Count(d => d.StepNumber == 7 &&
                                                            d.ClosureDate.HasValue && d.ClosureDate.Value.Year == DateTime.Now.Year)
                        })
                    .Where(DoesKanBanDealDtoHaveDeals)
                    .ToArray();
            }

            var subs = new List<Guid> { user.Id };

            if (userRoleNames.Contains("Ассистент менеджера по работе с клиентами") && user.ManagerId != null)
            {
                subs = await GetSubordinatesGuidAsync((Guid)user.ManagerId);
            }

            if (isManagerOfProjectDep && user.Department?.ParentDepartment?.ManagerId != null)
            {
                subs = await GetSubordinatesGuidAsync((Guid)user.Department?.ParentDepartment?.ManagerId);
            }

            if (userRoleNames.Contains("Руководитель подразделения") ||
            userRoleNames.Contains("Руководитель офиса продаж"))
            {
                subs = await GetSubordinatesGuidAsync(user.Id);
            }

            var userDeals = await GetKanbanDtosForGroupingAsync(user, subs, salesUnit);

            return userDeals
                .GroupBy(x => new { x.SaleId, x.SaleName })
                .Select(x => new KanbanStartPageDealsDto
                {
                    SaleName = x.Key.SaleName,
                    SaleId = x.Key.SaleId,
                    IsProduct = user.Department.CanProduct,
                    IsLogistics = user.Department.Name == "ОЛ",
                    VerificationDealsCount = x.Count(d => d.StepNumber == 1 && d.DealIsActive),
                    DevelopmentDealsCount = x.Count(d => d.StepNumber == 2 && d.DealIsActive),
                    NegotiatingDealsCount = x.Count(d => d.StepNumber == 3 && d.DealIsActive),
                    ContestDealsCount = x.Count(d => d.StepNumber == 4 && d.DealIsActive),
                    SignDealsCount = x.Count(d => d.StepNumber == 5 && d.DealIsActive),
                    WorkDealsCount = x.Count(d => d.StepNumber == 6 && d.DealIsActive),
                    ClosedDealsCount = x.Count(d => d.StepNumber == 7 &&
                                                    d.ClosureDate.HasValue && d.ClosureDate.Value.Year == DateTime.Now.Year)
                })
                .Where(DoesKanBanDealDtoHaveDeals)
                .ToArray();
        }

        [HttpGet("FillDealAccessListTable")]
        public async Task<IActionResult> FillDealAccessListTable()
        {
            var dealIds = await applicationContext.Deals.Select(d => d.Id).ToListAsync();

            await accessManager.UpdateAccessForEntitiesAsync(dealIds);

            return Ok("Filling DealAccessListTable was successful");
        }

        private bool DoesKanBanDealDtoHaveDeals(KanbanStartPageDealsDto kanbanStartPageDealsDto)
        {
            return kanbanStartPageDealsDto.VerificationDealsCount > 0 ||
                   kanbanStartPageDealsDto.DevelopmentDealsCount > 0 ||
                   kanbanStartPageDealsDto.NegotiatingDealsCount > 0 ||
                   kanbanStartPageDealsDto.ContestDealsCount > 0 ||
                   kanbanStartPageDealsDto.SignDealsCount > 0 ||
                   kanbanStartPageDealsDto.WorkDealsCount > 0 ||
                   kanbanStartPageDealsDto.ClosedDealsCount > 0;
        }

        [HttpPut("MakeInvisible/{id}")]
        public async Task<IActionResult> MakeInvisible([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var deal = await applicationContext.Deals
                .Include(d => d.ServicesRequests)
                .Include(d => d.ProductRequests)
                .Include(d => d.ResponsibleUser)
                .SingleOrDefaultAsync(m => m.Id == id);

            if (deal == null)
            {
                return NotFound();
            }

            var user = await userManager.GetCurrentUserAsync();

            if (!user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name) || ur.Role.Name == "Ассистент менеджера по работе с клиентами") &&
                deal.ResponsibleUserId != user.Id &&
                deal.ResponsibleUser?.ManagerId != user.Id)
                return StatusCode(403);

            foreach (var dealServicesRequest in deal.ServicesRequests)
            {
                dealServicesRequest.IsVisible = false;
            }

            foreach (var dealProductRequest in deal.ProductRequests)
            {
                dealProductRequest.IsVisible = false;
            }

            deal.IsVisible = false;
            deal.ChangedByUserId = user.Id;
            deal.ChangedDate = DateTime.Now;

            log.Info($"Deal {deal.Id} made invisibled by user: {user.DisplayName} ({user.Id})");

            await applicationContext.SaveChangesAsync();

            return Ok(deal);
        }

        private static string GetProbability(string i)
        {
            return i switch
            {
                "1" => "Маловероятная",
                "2" => "Вероятная",
                "3" => "Подписанная",
                _ => "Маловероятная"
            };
        }

        private async Task<List<KanbanStartPageForGroupingDto>> GetKanbanDtosForGroupingAsync(User user, List<Guid> managedUserIds, string salesUnit)
        {
            if (user.Department.CanProduct)
                return await applicationContext.VendorsRequests
                    .Where(
                        vr => vr.Request.DealId.HasValue && managedUserIds.Contains(vr.ResponsibleId)
                              && (string.IsNullOrWhiteSpace(salesUnit) || salesUnit.Contains(vr.Request.Deal.SalesUnitDeal.Name)))
                    .Select(
                        x => new KanbanStartPageForGroupingDto
                        {
                            SaleName = x.Responsible.DisplayName,
                            ResponsibleIsActive = x.Responsible.IsActive,
                            DealIsActive = x.Request.Deal.DealStatus.Name == "Активная",
                            IsManager = x.Responsible.Department.ManagerId == x.ResponsibleId,
                            IsManagerOfTopDep = x.Responsible.Department.ManagerId == x.ResponsibleId && !x.Responsible.Department.ParentDepartmentId.HasValue,
                            SaleId = x.ResponsibleId,
                            StepNumber = x.Request.Deal.Step.OrderNumber,
                            ClosureDate = x.Request.Deal.ClosureDate
                        })
                    .OrderByDescending(d => d.ResponsibleIsActive).ThenByDescending(d => d.IsManager).ThenByDescending(d => d.IsManagerOfTopDep)
                    .ToListAsync();

            if(user.Department.Name == "ОЛ")
                return await applicationContext.Deals
                    .Where(x => x.IndustrialUnitDeals.Any(u => u.IndustrialUnit.Name == "ОЛ"))
                    .Select(x => new KanbanStartPageForGroupingDto
                    {
                        SaleName = user.DisplayName,
                        ResponsibleIsActive = x.ResponsibleUser.IsActive,
                        DealIsActive = x.DealStatus.Name == "Активная",
                        SaleId = user.Id,
                        StepNumber = x.Step.OrderNumber,
                        ClosureDate = x.ClosureDate
                    })
                    .OrderByDescending(d => d.ResponsibleIsActive)
                    .ToListAsync();

            return await applicationContext.Deals
                .Where(x => managedUserIds.Contains(x.ResponsibleUserId) && (string.IsNullOrWhiteSpace(salesUnit) || salesUnit.Contains(x.SalesUnitDeal.Name)))
                .Select(x => new KanbanStartPageForGroupingDto
                {
                    SaleName = x.ResponsibleUser.DisplayName,
                    ResponsibleIsActive = x.ResponsibleUser.IsActive,
                    DealIsActive = x.DealStatus.Name == "Активная",
                    IsManager = x.ResponsibleUser.Department.ManagerId == x.ResponsibleUserId,
                    IsManagerOfTopDep = x.ResponsibleUser.Department.ManagerId == x.ResponsibleUserId && !x.ResponsibleUser.Department.ParentDepartmentId.HasValue,
                    SaleId = x.ResponsibleUserId,
                    StepNumber = x.Step.OrderNumber,
                    ClosureDate = x.ClosureDate
                })
                .OrderByDescending(d => d.ResponsibleIsActive).ThenByDescending(d => d.IsManager).ThenByDescending(d => d.IsManagerOfTopDep)
                .ToListAsync();
        }

        private async Task<List<KanbanStartPageForGroupingDto>> GetKanbanDtosForGroupingForTopAsync(string salesUnit)
        {
            return await applicationContext.Deals
                    .Where(x => string.IsNullOrWhiteSpace(salesUnit) || salesUnit.Contains(x.SalesUnitDeal.Name))
                    .Select(x => new KanbanStartPageForGroupingDto
                    {
                        SaleName = x.ResponsibleUser.DisplayName,
                        SaleId = x.ResponsibleUserId,
                        ResponsibleIsActive = x.ResponsibleUser.IsActive,
                        DealIsActive = x.DealStatus.Name == "Активная",
                        IsManager = x.ResponsibleUser.Department.ManagerId == x.ResponsibleUserId,
                        IsManagerOfTopDep = x.ResponsibleUser.Department.ManagerId == x.ResponsibleUserId && !x.ResponsibleUser.Department.ParentDepartmentId.HasValue,
                        StepNumber = x.Step.OrderNumber,
                        ClosureDate = x.ClosureDate
                    })
                    .OrderByDescending(d => d.ResponsibleIsActive).ThenByDescending(d => d.IsManager).ThenByDescending(d => d.IsManagerOfTopDep)
                    .ToListAsync();
        }

        private async Task EditMultipleFieldsAsync(JObject data, Deal deal)
        {
            var industrialUnitArray = data.GetValue("industrialUnitsIds").ToArray();
            var industrialUnitList = industrialUnitArray[0] != null ? GetDepartmentsList(industrialUnitArray) : null;

            if (industrialUnitList != null && industrialUnitList.Count != 0)
            {
                var lastIndustrial = applicationContext.IndustrialUnitDeals.Where(b => b.DealId == deal.Id).ToList();

                foreach (var industrialUnit in lastIndustrial)
                    applicationContext.IndustrialUnitDeals.Remove(industrialUnit);

                foreach (var industrialUnit in industrialUnitList)
                    await applicationContext.IndustrialUnitDeals.AddAsync(new IndustrialUnitDeal { DealId = deal.Id, IndustrialUnit = applicationContext.Departments.SingleOrDefault(f => f.Id == industrialUnit) });
            }

            var productUnitArray = data.GetValue("productUnitsIds").ToArray();
            var productUnitList = productUnitArray[0] != null ? GetDepartmentsList(productUnitArray) : null;

            if (productUnitList != null && productUnitList.Count != 0)
            {
                var lastProducts = applicationContext.ProductUnitDeals.Where(b => b.DealId == deal.Id).ToList();

                foreach (var productUnit in lastProducts)
                    applicationContext.ProductUnitDeals.Remove(productUnit);

                foreach (var productUnit in productUnitList)
                    await applicationContext.ProductUnitDeals.AddAsync(new ProductUnitDeal { DealId = deal.Id, ProductUnit = applicationContext.Departments.SingleOrDefault(g => g.Id == productUnit) });
            }

            var productLineArray = data.GetValue("productLineId").ToArray();
            var listLines = new List<Guid>();

            foreach (var l in productLineArray)
                listLines.Add((Guid)l);

            if (listLines.Count != 0)
            {
                var lastLines = applicationContext.ProductLineDeals.Where(b => b.DealId == deal.Id).ToList();

                foreach (var productLine in lastLines)
                    applicationContext.ProductLineDeals.Remove(productLine);

                foreach (var item5 in listLines)
                    await applicationContext.ProductLineDeals.AddAsync(new ProductLineDeal { DealId = deal.Id, ProductLine = applicationContext.ProductLines.SingleOrDefault(g => g.Id == item5) });
            }

            var peoplesArray = data.GetValue("peopleOfInterest").ToArray();
            var peoplesList = new List<Guid>();

            foreach (var token in peoplesArray)
                peoplesList.Add((Guid)token);

            if (peoplesList.Count != 0)
            {
                await UpdatePeopleOfInterest(deal, peoplesList);
            }
        }

        private async Task UpdatePeopleOfInterest(Deal deal, List<Guid> peoplesList)
        {
            var peoplesListIds = peoplesList.Select(id => id.ToString()).JoinAsString(", ");
            log.Info($"Deal {deal.Name} ({deal.Id}) creating with people of interest: {peoplesListIds}");

            var lastPeople = applicationContext.PeopleOfInterestDeals.Where(b => b.DealId == deal.Id).ToList();

            foreach (var peopleOfInterest in lastPeople)
                applicationContext.PeopleOfInterestDeals.Remove(peopleOfInterest);

            foreach (var peopleOfInterest in peoplesList.Distinct())
            {
                try
                {
                    await applicationContext.PeopleOfInterestDeals.AddAsync(new PeopleOfInterestDeal {DealId = deal.Id, ContactId = peopleOfInterest});
                }
                catch (Exception e)
                {
                    log.Error($"Deal: {deal.Id}, Interest People: {peopleOfInterest}, Exception: {e}");
                }
            }
        }

        private async Task EditCloudLinksAsync(JObject data, Deal deal)
        {
            var jTokens = data.GetValue("fileLinks").ToArray();
            var cloudLinkList = new List<CloudLinkDto>();

            foreach (var token in jTokens)
                cloudLinkList.Add(token.ToObject<CloudLinkDto>());

            var oldCloudLinks = await applicationContext.CloudLinks.Where(c => c.DealId == deal.Id).ToListAsync();

            foreach (var cloudLinkDto in cloudLinkList)
            {
                var oldCloudLink = oldCloudLinks.SingleOrDefault(c => c.LinkName == cloudLinkDto.LinkName);

                if (oldCloudLink == null)
                {
                    cloudLinkDto.DealId = deal.Id;

                    await applicationContext.CloudLinks.AddAsync(
                        new CloudLink
                        {
                            DealId = deal.Id,
                            Link = cloudLinkDto.Link,
                            LinkName = cloudLinkDto.LinkName,
                            AuthorId = cloudLinkDto.AuthorId,
                            AddingDateTime = DateTime.Now
                        });
                }
                else
                {
                    if (oldCloudLink.Link != cloudLinkDto.Link)
                    {
                        oldCloudLink.Link = cloudLinkDto.Link;
                        applicationContext.CloudLinks.Update(oldCloudLink);
                    }

                    oldCloudLinks.Remove(oldCloudLink);
                }
            }

            applicationContext.CloudLinks.RemoveRange(oldCloudLinks);
        }

        private List<Guid> GetDepartmentsList(JToken[] jtoken)
        {
            var departmentsList = new List<Guid>();
            foreach (var id in jtoken[0])
            {
                departmentsList.Add((Guid)id);
            }
            return departmentsList;
        }

        private int GetProbability(int stepNumber)
        {
            return stepNumber switch
            {
                1 => 10,
                2 => 20,
                3 => 40,
                4 => 60,
                5 => 90,
                _ => 100
            };
        }

        private async Task<bool> ChangeStep(int step, JObject data)
        {
            var isDVS = (bool)data.GetValue("isDVS"); // если производственный отдел
            var salesDepartmentsArray = data.GetValue("salesDepartmentsIds").ToArray();
            var industrialDepartmentArray = data.GetValue("industrialDepartmentsIds").ToArray();
            var salesUnitArray = data.GetValue("salesUnitsIds").ToArray();
            var selectionProcedureId = (Guid?)data.GetValue("selectionProcedureId");

            var selectionProcedure = await applicationContext.SelectionProcedures.SingleOrDefaultAsync(s => s.Id == selectionProcedureId);

            var industrialUnitArray = data.GetValue("industrialUnitsIds").ToArray();
            var productUnitArray = data.GetValue("productUnitsIds").ToArray();
            var productLineArray = data.GetValue("productLine").ToArray();

            var peoplesArray = data.GetValue("peopleOfInterest").ToArray();

            var listLines = new List<Guid>();
            foreach (var l in productLineArray)
                listLines.Add((Guid)l);

            var jTokens = data.GetValue("fileLinks").ToArray();
            var cloudLinkList = new List<CloudLinkDto>();

            foreach (var token in jTokens)
                cloudLinkList.Add(token.ToObject<CloudLinkDto>());

            var listPeoples = new List<Guid>();
            foreach (var l in peoplesArray)
                listPeoples.Add((Guid)l);

            List<Guid> industrialUnitList = industrialUnitArray[0] != null ? GetDepartmentsList(industrialUnitArray) : null;
            List<Guid> productUnitList = productUnitArray[0] != null ? GetDepartmentsList(productUnitArray) : null;

            switch (step)
            {
                case 1:
                    if ((string)data.GetValue("dealTypeId") != null &&
                        (string)data.GetValue("purchaseTimeIntervalId") != null &&
                        (string)data.GetValue("hintVerificationStepClientsTasksAndNeeds") != "" &&
                        (string)salesDepartmentsArray[0] != null &&
                        (string)industrialDepartmentArray[0] != null &&
                        industrialUnitList.Count != 0 &&
                        productUnitList.Count != 0 &&
                        listLines.Count != 0 &&
                        (string)salesUnitArray[0] != null)
                        return true;
                    break;
                case 2:
                    if (!isDVS)
                        if (!((bool)data.GetValue("hintDevelopmentStepDefineWorkGroup") &&
                        (bool)data.GetValue("hintDevelopmentStepDefineVendors") &&
                        (bool)data.GetValue("hintDevelopmentStepRegisterProjectWithVendor") &&
                        (bool)data.GetValue("hintDevelopmentStepDevelopTKP") &&
                        (bool)data.GetValue("hintDevelopmentStepLayoutProject") &&
                        //файлик
                        (string)data.GetValue("fileLayout") != ""))
                            return false;

                    if ((string)data.GetValue("dealTypeId") != null &&
                    (string)data.GetValue("decisionMakerId") != null &&
                    (string)salesDepartmentsArray[0] != null &&
                    (string)industrialDepartmentArray[0] != null &&
                    industrialUnitList.Count != 0 &&
                    productUnitList.Count != 0 &&
                    listLines.Count != 0 &&
                    (string)salesUnitArray[0] != null &&
                    (string)data.GetValue("estimatedMargin") != "0.00" &&
                    (string)data.GetValue("estimatedBudget") != "0.00")
                        return true;
                    break;
                case 3:
                    if (!isDVS)
                        if (!((bool)data.GetValue("hintNegotiatingStepMeetingWithCustomer") &&
                        (bool)data.GetValue("hintNegotiatingStepApproveSpecificationWithCustomer") &&
                        (bool)data.GetValue("hintNegotiatingStepApproveSolutionArchitectureWithCustomer") &&
                        (bool)data.GetValue("hintNegotiatingStepLayoutUpdating") &&

                        (string)data.GetValue("fileProposal") != "" &&
                        (string)data.GetValue("fileUpdatedLayout") != ""))
                            return false;

                    if ((string)data.GetValue("contractClosureDate") != "" &&
                        (string)data.GetValue("contractSigningDate") != "" &&
                        (string)data.GetValue("decisionMakerId") != null &&

                        (string)data.GetValue("estimatedRealMargin") != "0.00" &&
                        (string)data.GetValue("estimatedMargin") != "0.00" &&
                        (string)data.GetValue("estimatedBudget") != "0.00")
                        return true;
                    break;
                case 4:
                    if (!isDVS)
                        if (!((bool)data.GetValue("hintContestStepGetContestDocs") &&
                        (bool)data.GetValue("hintContestStepContestClaim") &&
                        (bool)data.GetValue("hintContestStepNotifyHostTeam") &&
                        (bool)data.GetValue("hintContestStepGetSpecialPrices") &&
                        (bool)data.GetValue("hintContestStepLayoutWithRisks") &&
                        (bool)data.GetValue("hintContestStepNotifyVendorsTeam") &&
                        (bool)data.GetValue("hintContestStepSupplyConditions") &&
                        //файлики
                        (selectionProcedure.Name == "Неформализованная процедура" ||
                            (string)data.GetValue("fileTz") != "") &&
                        (selectionProcedure.Name == "Неформализованная процедура" || (string)data.GetValue("fileContestDocumentation") != "0" || cloudLinkList.Any(l => l.LinkName == "contest-file-contest-documentation-cloud")) &&
                        (string)data.GetValue("fileTkp") != "" &&
                        (string)data.GetValue("fileProjectContest") != "" &&
                        (string)data.GetValue("fileUpdatedLayout") != ""))
                            return false;

                    if ((string)data.GetValue("contractClosureDate") != "" &&
                        (string)data.GetValue("contractSigningDate") != "" &&
                        (string)data.GetValue("procurementProcedureResultsDate") != "" &&
                        (string)data.GetValue("selectionProcedureId") != null &&
                        listPeoples.Count != 0 &&
                        (string)data.GetValue("estimatedRealMargin") != "0.00" &&
                        (string)data.GetValue("estimatedBudget") != "0.00" &&
                        (string)data.GetValue("estimatedMargin") != "0.00")

                        return true;
                    break;
                case 5:
                    if (!isDVS)
                        if (!((bool)data.GetValue("hintContractSignedStepApproveProjectWithVendor") &&
                        (bool)data.GetValue("hintContractSignedStepCheckSigningProcedureFormat") &&
                        (bool)data.GetValue("hintContractSignedStepFormatSaleIn1C") &&
                        (bool)data.GetValue("hintContractSignedStepPassClaimForService") &&
                        (bool)data.GetValue("hintContractSignedStepUpdateDataInSystems") &&
                        //файлики
                        (string)data.GetValue("fileUpdatedLayout") != "") && (string)data.GetValue("fileContractScan") != "")
                            return false;

                    if ((string)data.GetValue("contractClosureDate") != null &&
                        (string)data.GetValue("contractSigningDate") != null &&
                        (string)data.GetValue("estimatedRealMargin") != "0.00" &&
                        (string)data.GetValue("hintContractSignedStepDealAmount") != "0.00" &&
                        (string)data.GetValue("estimatedMargin") != "0.00")
                        return true;
                    break;
                case 6:
                    if (!isDVS)
                        if (!(bool)data.GetValue("hintContractWorksStepSupplyMonitoring") &&
                            (bool)data.GetValue("hintContractWorksStepPaymentControl") &&
                            (bool)data.GetValue("hintContractWorksStepPassDocsToAccounting"))
                            return false;

                    if ((string)data.GetValue("estimatedRealMargin") != "0.00")
                        return true;
                    break;
            }
            return false;
        }
    }
}

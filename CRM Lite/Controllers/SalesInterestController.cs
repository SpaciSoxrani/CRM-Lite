using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CRM.API.Utilities;
using CRM.Data;
using CRM.Data.AuxiliaryModels;
using CRM.Data.Models;
using CRM.Data.Models.Lookup;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/SalesInterest")]
    [Authorize]
    public class SalesController : Controller
    {
        private readonly ApplicationContext context;
        private readonly IAccessManager accessManager;
        private readonly IBackgroundJobClient backgroundJob;
        private readonly UserManager userManager;

        private readonly HashSet<string> fullAccessRoleNames = new HashSet<string>
        {
            "Администратор",
            "TOP-менеджер",
            "Менеджер по СМК"
        };

        public SalesController(ApplicationContext context, UserManager userManager, IAccessManager accessManager, IBackgroundJobClient backgroundJob)
        {
            this.context = context;
            this.userManager = userManager;
            this.accessManager = accessManager;
            this.backgroundJob = backgroundJob;
        }

        [HttpGet("{id}/{userId}")]
        public async Task<ActionResult<SalesInterest>> GetInterest([FromRoute] Guid id, [FromRoute] Guid userId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var hasAccess = await accessManager.HasAccessToViewInterestAsync(userId, id);

            if (!hasAccess)
                return StatusCode(403);

            var salesInterest = await context.SalesInterest
                .SingleOrDefaultAsync(m => m.Id == id);

            if (salesInterest == null)
                return NotFound();

            return salesInterest;
        }

        [HttpGet]
        [Route("~/api/SalesInterestsForList")]
        public JsonResult DepartmentsForList()
        {
            var salesInterest = context.SalesInterest
                .Include(i => i.Contact)
                .Include(i => i.Organization)
                .Include(i => i.InterestQualification)
                .Include(i => i.Responsible)
                .Select(i => new
                {
                    id = i.Id,
                    name = i.Organization == null ? "" : i.Organization.ShortName,
                    contact = i.Contact == null ? "" : i.Contact.DisplayName,
                    description = i.Description,
                    qualification = i.InterestQualification == null ? "" : i.InterestQualification.Name,
                    responsible = i.Responsible.DisplayName
                });

            return Json(salesInterest);
        }

        [HttpPost]
        [Route("~/api/PostSalesInterest")]
        public async Task<IActionResult> PostSalesInterest([FromBody] JObject data)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            SalesInterest salesInterest;
            var isNew = false;

            var salesInterestId = (Guid?)data.GetValue("id");
            var userId = (Guid?) data.GetValue("userId");

            if (salesInterestId != null)
            {
                salesInterest = context.SalesInterest
                    .Include(si => si.Contact)
                    .SingleOrDefault(si => si.Id == salesInterestId);

                if (salesInterest == null)
                    return StatusCode(404);

                if (userId == null)
                    return StatusCode(401);

                if (!await accessManager.HasAccessToEditInterestAsync((Guid)userId, (Guid)salesInterestId))
                    return StatusCode(403);
            }
            else
            {
                salesInterest = new SalesInterest();
                isNew = true;
            }

            salesInterest.InterestId = (Guid)data.GetValue("Interest");
            salesInterest.CreatorId ??= userId;

            salesInterest.ContactId = (Guid?)data.GetValue("Contact");
            salesInterest.JobTitle = (string)data.GetValue("JobTitle");
            salesInterest.Email = (string)data.GetValue("Email");
            salesInterest.MobilePhone = (string)data.GetValue("MobilePhone");
            salesInterest.WorkPhone = (string)data.GetValue("WorkPhone");

            salesInterest.OrganizationId = (Guid?)data.GetValue("Organization");
            salesInterest.WebSite = (string)data.GetValue("WebSite");
            salesInterest.Address = (string)data.GetValue("Address");
            salesInterest.IndustryId = (Guid?)data.GetValue("IndustryId");

            salesInterest.IsMarketingMaterialsIncluded = (bool?)data.GetValue("IsMarketingMaterial");
            salesInterest.MarketingCompanySource = (string)data.GetValue("SourceCampaign");
            salesInterest.ResponsibleId = (Guid)data.GetValue("Responsible");
            salesInterest.Theme = (string)data.GetValue("Theme");
            salesInterest.Description = (string)data.GetValue("Description");
            if ((string)data.GetValue("LastCompanyDate") != "" && (string)data.GetValue("LastCompanyDate") != null)
                salesInterest.LastCompanyDate = (DateTime)data.GetValue("LastCompanyDate");

            salesInterest.InterestQualificationId = (Guid?)data.GetValue("InterestQualificationId");
            salesInterest.PlanBudget = (double?)data.GetValue("PlanBudget");
            salesInterest.ProductLineId = (Guid?)data.GetValue("ProductLineId");
            salesInterest.RealisationPlanId = (Guid?)data.GetValue("RealisationPlanId");
            salesInterest.MainContactString = (string)data.GetValue("MainContactString");
            salesInterest.ClientsTasks = (string)data.GetValue("ClientsTasks");
            salesInterest.Step = isNew ? 1 : salesInterest.Step;

            ChangeStep(salesInterest);

            if (isNew)
                context.SalesInterest.Add(salesInterest);
            else
                context.SalesInterest.Update(salesInterest);

            var isMergedToDeal = (bool)data.GetValue("IsReadyToMergeToDeal");
            var dealId = Guid.Empty;

            if (isMergedToDeal)
                dealId = MergeInterestToDeal(salesInterest);

            await context.SaveChangesAsync();

            if (isMergedToDeal)
            {
                backgroundJob.Enqueue(() => accessManager.UpdateAccessForEntitiesAsync(new List<Guid> { dealId }));
                return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = dealId });
            }

            return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = salesInterest.Id });
        }

        private Guid MergeInterestToDeal(SalesInterest salesInterest)
        {
            // ReSharper disable once UseObjectOrCollectionInitializer
            var deal = new Deal();

            deal.ChangedDate = DateTime.Now;
            deal.ContactId = salesInterest.ContactId;
            deal.CreatedDate = DateTime.Now;
            deal.ShortName = salesInterest.Theme;
            deal.OrganizationId = salesInterest.OrganizationId;
            deal.Name = GetDealName((Guid)deal.OrganizationId, deal.ShortName);
            deal.Probability = 10;
            deal.Competitors = "";
            deal.ResponsibleUserId = salesInterest.ResponsibleId;
            deal.StepId = context.Steps
                .Where(s => s.OrderNumber == 1)
                .Select(s => s.Id)
                .FirstOrDefault();
            deal.IsProbable = "1";
            deal.HintVerificationStepClientsTasksAndNeeds = salesInterest.ClientsTasks;
            deal.IsMergedFromInterest = true;
            deal.DealStatusId = context.DealStatus
                .Where(ds => ds.Name == "Активная")
                .Select(ds => ds.Id)
                .FirstOrDefault();

            context.Deals.Add(deal);

            return deal.Id;
        }

        private string GetDealName(Guid organizationId, string dealShortName)
        {
            var organization = context.Organizations.SingleOrDefault(e => e.Id == organizationId);
            var dealsCount = context.Deals.Where(e => e.OrganizationId == organization.Id).Count().ToString("##0000");
            var dealName = "[" + organization.ShortName + "-" + dealsCount + "] - " + dealShortName ?? "";
            return dealName;
        }

        private void ChangeStep(SalesInterest salesInterest)
        {
            if (salesInterest.OrganizationId != null &&
                salesInterest.Email != "" &&
                salesInterest.Step == 1)
                salesInterest.Step++;
        }

        [HttpPut("MakeInvisible/{id}")]
        public async Task<IActionResult> MakeInvisible([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var salesInterest = await context.SalesInterest.Include(s => s.Responsible).SingleOrDefaultAsync(m => m.Id == id);
            if (salesInterest == null)
            {
                return NotFound();
            }

            var user = await userManager.GetCurrentUserAsync();

            if (!user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name)) &&
                salesInterest.ResponsibleId != user.Id &&
                salesInterest.Responsible.ManagerId != user.Id)
                return StatusCode(403);

            salesInterest.IsVisible = false;
            await context.SaveChangesAsync();

            return Ok(salesInterest);
        }

        [HttpGet]
        [Route("~/api/GetInterestQualification")]
        public JsonResult GetInterestQualification()
        {
            return Json(context.InterestQualification.Select(e => new
            {
                e.Id,
                e.Name
            }).ToList());
        }

        [HttpGet]
        [Route("~/api/GetRealizationPlans")]
        public JsonResult GetRealizationPlans()
        {
            return Json(context.RealisationPlan.Select(e => new
            {
                e.Id,
                e.Name
            }).ToList());
        }
    }
}
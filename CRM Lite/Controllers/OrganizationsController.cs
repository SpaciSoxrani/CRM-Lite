using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.API.Utilities;
using CRM.Data;
using CRM.Data.Dtos;
using CRM.Data.Dtos.Organization;
using CRM.Data.Models;
using CRM.Data.Models.Lookup;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vostok.Logging.Abstractions;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/Organizations")]
    [Authorize]
    public class OrganizationsController : Controller
    {
        private readonly ApplicationContext applicationContext;
        private readonly IAccessManager accessManager;
        private readonly IBackgroundJobClient backgroundJob;
        private readonly IMapper mapper;
        private readonly ILog log;
        private readonly UserManager userManager;

        private readonly HashSet<string> fullAccessRoleNames = new HashSet<string>
        {
            "Администратор",
            "TOP-менеджер",
            "Менеджер по СМК"
        };

        public OrganizationsController(ApplicationContext applicationContext, IMapper mapper, ILog log, UserManager userManager, IAccessManager accessManager, IBackgroundJobClient backgroundJob)
        {
            this.applicationContext = applicationContext;
            this.userManager = userManager;
            this.accessManager = accessManager;
            this.backgroundJob = backgroundJob;
            this.mapper = mapper;
            this.log = log;
        }

        [HttpGet("OrganizationsNames")]
        public async Task<OrganizationShortDto[]> OrganizationsNames()
        {
            var organizations = await applicationContext.Organizations
                .ToArrayAsync();

            return mapper.Map<OrganizationShortDto[]>(organizations);
        }

        [HttpGet("Active/OrganizationsNames")]
        public async Task<OrganizationShortDto[]> ActiveOrganizationsNames()
        {
            var organizations = await applicationContext.Organizations
                .Where(org => org.IsActive)
                .ToArrayAsync();

            return mapper.Map<OrganizationShortDto[]>(organizations);
        }

        [HttpGet("Inn/{inn}")]
		public async Task<OrganizationAddressAndBankDetailsGuidsDto> OrganizationByInn([FromRoute] string inn)
        {
            var organization = await applicationContext.Organizations
                .Include(o => o.BankDetails)
                .FirstOrDefaultAsync(org => org.BankDetails != null && org.BankDetails.Inn == inn);

            if (organization == null)
                return null;

            return mapper.Map<OrganizationAddressAndBankDetailsGuidsDto>(organization);
        }

        [HttpGet("ForList")]
        public async Task<OrganizationForListDto[]> ForList()
        {
            var organizations = await applicationContext.Organizations
                .Include(o => o.ResponsibleUser)
                .Include(org => org.SalesOffice)
                .Include(org => org.Industry)
                .Include(org => org.Relationship)
                .Include(org => org.Address).ToArrayAsync();

            return mapper.Map<OrganizationForListDto[]>(organizations);
        }
			   
        [HttpGet]
        public async Task<OrganizationDto[]> AllOrganizations()
        {
            var organizations = await applicationContext.Organizations.ToArrayAsync();

            return mapper.Map<OrganizationDto[]>(organizations);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrganizationDto>> SearchForId([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)            
                return BadRequest(ModelState);            

            var organization = await applicationContext.Organizations.SingleOrDefaultAsync(m => m.Id == id);

            if (organization == null)            
                return NotFound();
            
            return mapper.Map<OrganizationDto>(organization);
        }

        [HttpPut("{organizationId}")]
        public async Task<ActionResult> EditOrganization([FromRoute] Guid organizationId, [FromBody] OrganizationDto organizationDto)
        {
            if (!ModelState.IsValid)            
                return BadRequest(ModelState);            

            if (organizationId != organizationDto.Id)            
                return BadRequest();

            var user = await userManager.GetCurrentUserAsync();

            var hasAccess = await accessManager.HasAccessToEditOrganizationAsync(user.Id, organizationId);

            if (!hasAccess)
                return StatusCode(403);

            var organization = mapper.Map<Organization>(organizationDto);
            var bankDetails = mapper.Map<BankDetails>(organizationDto.BankDetails);
            var bankDetailsBank = mapper.Map<BankDetails>(organizationDto.BankDetailsBank);
            var address = mapper.Map<Address>(organizationDto.Address);
            var legalAddress = mapper.Map<Address>(organizationDto.LegalAddress);

            organization.ChangedByUserId = user.Id;
            organization.ChangedDate = DateTime.Now;

            var sameInnOrganization = await CheckForOrganizationWithSameInnAsync(bankDetails.Inn, organizationId);

            if (sameInnOrganization != null)
                return Ok(sameInnOrganization);

            applicationContext.Entry(organization).State = EntityState.Modified;
            applicationContext.Entry(bankDetails).State = EntityState.Modified;
            applicationContext.Entry(address).State = EntityState.Modified;

            if (!legalAddress.IsEmpty())
            {
                if (organization.LegalAddressId == null)
                    organization.LegalAddress = legalAddress;
                else
                    applicationContext.Entry(legalAddress).State = EntityState.Modified;
            }

            if (!bankDetailsBank.IsEmpty())
            {
                if (organization.BankDetailsBankId == null)
                    organization.BankDetailsBank = bankDetailsBank;
                else
                    applicationContext.Entry(bankDetailsBank).State = EntityState.Modified;
            }

            try
            {
                await applicationContext.SaveChangesAsync();

                await UpdateAccessAndChangeResponsibles(organizationId, organization.ResponsibleUserId,
                    organizationDto.ResponsibleUserChanged);

                log.Info($"Organization {organization.FullName} ({organization.Id}) was edited by user: {user.DisplayName} ({user.Id})");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OrganizationExists(organizationId))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [NonAction]
        private async Task UpdateAccessAndChangeResponsibles(Guid organizationId, Guid? responsibleUser, bool responsibleUserChanged)
        {
            var organizationDeals = applicationContext.Deals
                .Where(d => d.OrganizationId == organizationId)
                .Select(d => d.Id)
                .ToList();

            backgroundJob.Enqueue(() => accessManager.UpdateAccessForEntitiesAsync(organizationDeals));

            if (responsibleUser != null && responsibleUserChanged)
            {
                var dbOrganization = await applicationContext.Organizations
                    .Include(o => o.Deals)
                    .Include(o => o.Contacts)
                    .Include(o => o.SalesInterests)
                    .SingleOrDefaultAsync(o => o.Id == organizationId);

                await ChangeResponsiblesAtDealsAndInterests(dbOrganization.Deals, dbOrganization.SalesInterests, dbOrganization.Contacts, (Guid) responsibleUser);
            }
        }

        [NonAction]
        private async Task<Guid?> CheckForOrganizationWithSameInnAsync(string inn, Guid organizationId)
        {
            var organizationsWithInn =
                await applicationContext.Organizations.FirstOrDefaultAsync(o =>
                    o.BankDetails.Inn == inn && o.Id != organizationId);

            return organizationsWithInn?.Id;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrganization([FromBody] OrganizationDto organizationDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await userManager.GetCurrentUserAsync();

            var address = mapper.Map<Address>(organizationDto.Address);
            var legalAddress = mapper.Map<Address>(organizationDto.LegalAddress);
            var bankDetails = mapper.Map<BankDetails>(organizationDto.BankDetails);
            var bankDetailsBank = mapper.Map<BankDetails>(organizationDto.BankDetailsBank);
            var organization = mapper.Map<Organization>(organizationDto);

            organization.BankDetails = bankDetails;
            organization.BankDetailsBank = bankDetailsBank;
            organization.Address = address;

            if (!legalAddress.IsEmpty())
                organization.LegalAddress = legalAddress;

            if (!bankDetailsBank.IsEmpty())
                organization.BankDetailsBank = bankDetailsBank;

            organization.CreatedByUserId = user.Id;
            organization.CreatedDate = DateTime.Now;

            await applicationContext.Organizations.AddAsync(organization);

            var mainContact = await applicationContext.Contacts.SingleOrDefaultAsync(c => c.Id == organization.MainContactId);
            mainContact.OrganizationId = organization.Id;

            await applicationContext.SaveChangesAsync();

            log.Info($"Organization {organization.FullName} ({organization.Id}) was created by user: {user.DisplayName} ({user.Id})");

            return CreatedAtAction("CreateOrganization", new { id = organization.Id }, organization);
        }

        [NonAction]
        private async Task ChangeResponsiblesAtDealsAndInterests(IEnumerable<Deal> organizationDeals,
                                                                 IEnumerable<SalesInterest> organizationSalesInterests,
                                                                 IEnumerable<Contact> organizationСontacts,
                                                                 Guid newResponsibleGuid)
        {
            foreach (var organizationDeal in organizationDeals)
                organizationDeal.ResponsibleUserId = newResponsibleGuid;

            foreach (var organizationSalesInterest in organizationSalesInterests)
                organizationSalesInterest.ResponsibleId = newResponsibleGuid;

            foreach (var organizationСontact in organizationСontacts)
                organizationСontact.ResponsibleUserId = newResponsibleGuid;

            await applicationContext.SaveChangesAsync();
        }

        [HttpGet("GetTopOrganizations")]
        public async Task<ActionResult<TopOrganizationDto[]>> GetTopOrganizationsAsync([FromQuery] int count = 10)
        {
            var user = await userManager.GetCurrentUserAsync();
            var isManagerOfTopDepartment = await applicationContext.Departments
                .AnyAsync(d => d.IsActive && !d.ParentDepartmentId.HasValue && d.ManagerId == user.Id);

            var isManagerOfProjectDep =
                await applicationContext.Departments.AnyAsync(d => d.Name.Contains("Проектный") && d.ManagerId == user.Id);

            var userRoleNames = applicationContext.UserRoles
                .Where(ur => ur.UserId == user.Id)
                .Select(ur => ur.Role.Name).ToHashSet();

            if (!isManagerOfTopDepartment && (userRoleNames.Contains("TOP-менеджер") ||
                userRoleNames.Contains("Менеджер по СМК") ||
                userRoleNames.Contains("Администратор")))
            {
                var allOrganizationDtos = await applicationContext.Deals
                    .Where(d => d.DealStatus.Name == "Активная" && d.OrganizationId.HasValue 
                                                                && d.Organization.ResponsibleUserId.HasValue 
                                                                && d.Organization.IsActive 
                                                                && d.EstimatedRealMargin.HasValue &&
                                (d.PurchaseTimeInterval == null ||
                                 d.PurchaseTimeInterval != null && d.PurchaseTimeInterval.Name != "Бюджетирование на будущие годы"))
                    .Select(x => new TopOrganizationDto
                    {
                        OrganizationId = x.Organization.Id,
                        OrganizationName = x.Organization.ShortName,
                        OrganizationExpertMargin = (double)x.EstimatedRealMargin,
                        OrganizationResponsibleName = x.Organization.ResponsibleUser.DisplayName
                    })
                    .ToListAsync();

                return allOrganizationDtos
                    .GroupBy(o => new {o.OrganizationId, o.OrganizationName, o.OrganizationResponsibleName})
                    .Select(
                        x => new TopOrganizationDto
                        {
                            OrganizationId = x.Key.OrganizationId,
                            OrganizationName = x.Key.OrganizationName,
                            OrganizationExpertMargin = Math.Round(x.Sum(o => o.OrganizationExpertMargin) / 1.2, 0),
                            OrganizationResponsibleName = x.Key.OrganizationResponsibleName
                        })
                    .OrderByDescending(o => o.OrganizationExpertMargin)
                    .Take(count)
                    .ToArray();
            }

            var subs = new List<Guid> { user.Id };

            if (userRoleNames.Contains("Ассистент менеджера по работе с клиентами") && user.ManagerId != null)
                subs = await GetSubordinatesGuidAsync((Guid)user.ManagerId);

            if (isManagerOfProjectDep && user.Department?.ParentDepartment?.ManagerId != null)
            {
                subs = await GetSubordinatesGuidAsync((Guid)user.Department?.ParentDepartment?.ManagerId);
            }

            if (userRoleNames.Contains("Руководитель подразделения") || userRoleNames.Contains("Руководитель офиса продаж"))
                subs = await GetSubordinatesGuidAsync(user.Id);

            var allFilteredOrganizationDtos = await applicationContext.Deals
                .Where(d => d.DealStatus.Name == "Активная" && d.OrganizationId.HasValue
                                                            && d.Organization.ResponsibleUserId.HasValue
                                                            && d.Organization.IsActive
                                                            && (user.Department.CanProduct && d.ProductRequests.Any(pr => pr.VendorsRequests.Any(vr => subs.Contains(vr.ResponsibleId)))
                                                                || d.Organization.ResponsibleUserId.HasValue && subs.Contains((Guid)d.Organization.ResponsibleUserId))
                                                            && d.EstimatedRealMargin.HasValue &&
                                                            (d.PurchaseTimeInterval == null ||
                                                             d.PurchaseTimeInterval != null && d.PurchaseTimeInterval.Name != "Бюджетирование на будущие годы"))
                .Select(x => new TopOrganizationDto
                {
                    OrganizationId = x.Organization.Id,
                    OrganizationName = x.Organization.ShortName,
                    OrganizationExpertMargin = (double)x.EstimatedRealMargin,
                    OrganizationResponsibleName = x.Organization.ResponsibleUser.DisplayName
                })
                .ToListAsync();

            return allFilteredOrganizationDtos
                .GroupBy(o => new { o.OrganizationId, o.OrganizationName, o.OrganizationResponsibleName })
                .Select(
                    x => new TopOrganizationDto
                    {
                        OrganizationId = x.Key.OrganizationId,
                        OrganizationName = x.Key.OrganizationName,
                        OrganizationExpertMargin = Math.Round(x.Sum(o => o.OrganizationExpertMargin) / 1.2, 0),
                        OrganizationResponsibleName = x.Key.OrganizationResponsibleName
                    })
                .OrderByDescending(o => o.OrganizationExpertMargin)
                .Take(count)
                .ToArray();
        }

        [HttpPut("MakeInvisible/{id}")]
        public async Task<IActionResult> MakeInvisible([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var organization = await applicationContext.Organizations
                .Include(o => o.ResponsibleUser)
                .SingleOrDefaultAsync(m => m.Id == id);

            if (organization == null)
            {
                return NotFound();
            }

            var user = await userManager.GetCurrentUserAsync();

            if (!user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name)) &&
                organization.ResponsibleUserId != user.Id &&
                organization.ResponsibleUser?.ManagerId != user.Id)
                return StatusCode(403);

            organization.IsVisible = false;
            organization.ChangedByUserId = user.Id;
            organization.ChangedDate = DateTime.Now;
            await applicationContext.SaveChangesAsync();

            log.Info($"Organization {organization.FullName} ({organization.Id}) was deleted by user: {user.DisplayName} ({user.Id})");

            return Ok(organization);
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

        [NonAction]
        private bool OrganizationExists(Guid id)
        {
            return applicationContext.Organizations.Any(e => e.Id == id);
        }
    }
}
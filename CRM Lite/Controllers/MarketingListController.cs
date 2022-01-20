using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.API.Utilities;
using CRM.API.Utilities.EMailServices;
using CRM.Data;
using CRM.Data.Dtos.MarketingList;
using CRM.Data.Models.Marketing.MarketingList;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mjml.AspNetCore;
using Vostok.Logging.Abstractions;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MarketingListController : ControllerBase
    {
        private readonly ApplicationContext applicationContext;
        private readonly UserManager userManager;
        private readonly IEmailSender emailSender;
        private readonly IMjmlServices mjmlServices;
        private readonly ILog log;
        private readonly IMapper mapper;

        private readonly HashSet<string> fullAccessRoleNames = new HashSet<string>
        {
            "Администратор",
            "TOP-менеджер",
            "Менеджер по СМК"
        };

        public MarketingListController(ApplicationContext applicationContext, UserManager userManager, ILog log, IMapper mapper, IMjmlServices mjmlServices, IEmailSender emailSender)
        {
            this.applicationContext = applicationContext;
            this.userManager = userManager;
            this.emailSender = emailSender;
            this.mjmlServices = mjmlServices;
            this.log = log;
            this.mapper = mapper;
        }

        [HttpGet("ForList")]
        public async Task<ActionResult<MarketingListForListDto[]>> AllMarketingListsAsync()
        {
            var marketingLists = await applicationContext.MarketingList.ToArrayAsync();

            return mapper.Map<MarketingListForListDto[]>(marketingLists);
        }

        [HttpGet("Presents")]
        public async Task<ActionResult<MarketingListPresentDto[]>> AllPresentsAsync()
        {
            var marketingListPresents = await applicationContext.MarketingListPresents.ToArrayAsync();

            return mapper.Map<MarketingListPresentDto[]>(marketingListPresents);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MarketingListDto>> GetMarketingListById([FromRoute] Guid id)
        {
            var marketingList = await applicationContext.MarketingList
                .Include(ml => ml.MarketingListContacts)
                    .ThenInclude(ml => ml.Contact)
                        .ThenInclude(ml => ml.ResponsibleUser)
                .Include(ml => ml.MarketingListContacts)
                    .ThenInclude(ml => ml.Contact)
                        .ThenInclude(ml => ml.Organization)
                            .ThenInclude(r => r.ResponsibleUser)
                                .ThenInclude(r => r.Department)
                                    .ThenInclude(r => r.ParentDepartment)
                .Include(ml => ml.MarketingListContacts)
                    .ThenInclude(ml => ml.Contact)
                        .ThenInclude(r => r.ResponsibleUser)
                            .ThenInclude(r => r.Department)
                                .ThenInclude(r => r.ParentDepartment)
                .Include(ml => ml.MarketingListContacts)
                    .ThenInclude(ml => ml.Contact)
                        .ThenInclude(ml => ml.Present)
                .SingleOrDefaultAsync(ml => ml.Id == id);

            return mapper.Map<MarketingListDto>(marketingList);
        }

        [HttpPost]
        public async Task<ActionResult> CreateMarketingListAsync([FromBody] MarketingListCreationDto marketingListDto)
        {
            log.Info("MarketingList start Creating");
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var user = await userManager.GetCurrentUserAsync();

            var marketingList = mapper.Map<MarketingList>(marketingListDto);

            marketingList.CreatedByUserId = user.Id;
            marketingList.CreatedDate = DateTime.Now;

            await applicationContext.MarketingList.AddAsync(marketingList);

            await applicationContext.SaveChangesAsync();

            log.Info("MarketingList Created by " + user.Id);
            return CreatedAtAction("CreateMarketingListAsync", new { id = marketingList.Id }, marketingList);
        }

        [HttpPut("UpdateName/{id}")]
        public async Task<ActionResult> UpdateMarketingListNameAsync([FromRoute] Guid id, [FromBody] MarketingListUpdateNameDto marketingListNameDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != marketingListNameDto.Id)
                return BadRequest();

            var user = await userManager.GetCurrentUserAsync();

            var marketingList = await applicationContext.MarketingList.SingleOrDefaultAsync(m => m.Id == id);

            log.Error(user.DisplayName + "Edit Name MarketingList");

            if (!user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name)) &&
                (!user.DepartmentId.HasValue || !user.Department.Name.Contains("маркетинг")) || marketingList.IsLocked)
                return StatusCode(403);

            marketingList.Name = marketingListNameDto.Name;

            try
            {
                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await MarketingListExistsAsync(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpPut("UpdateLock/{id}")]
        public async Task<ActionResult> UpdateMarketingListNameAsync([FromRoute] Guid id, [FromBody] MarketingListUpdateLockDto marketingListLockDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != marketingListLockDto.Id)
                return BadRequest();

            var user = await userManager.GetCurrentUserAsync();

            var marketingList = await applicationContext.MarketingList.SingleOrDefaultAsync(m => m.Id == id);

            log.Error(user.DisplayName + "Edit Lock MarketingList");

            if (!user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name)) &&
                (!user.DepartmentId.HasValue || !user.Department.Name.Contains("маркетинг")))
                return StatusCode(403);

            marketingList.IsLocked = marketingListLockDto.isLocked;

            try
            {
                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await MarketingListExistsAsync(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpPut("UpdateContactIds/{id}")]
        public async Task<ActionResult> UpdateMarketingListContactIdsAsync([FromRoute] Guid id, [FromBody] MarketingListUpdateContactIdsDto marketingListContactIdsDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != marketingListContactIdsDto.Id)
                return BadRequest();

            var user = await userManager.GetCurrentUserAsync();

            var marketingList = await applicationContext.MarketingList.SingleOrDefaultAsync(m => m.Id == id);

            if (marketingList.IsLocked)
                return StatusCode(403);

            log.Error(user.DisplayName + "Edit Contact Ids MarketingList");

            try
            {
                await UpdateContactsForMarketingList(marketingListContactIdsDto.ContactIds, marketingList, true);

                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await MarketingListExistsAsync(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpPut("MakeInvisible/{id}")]
        public async Task<ActionResult> MakeInvisibleAsync([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var marketingList = await applicationContext.MarketingList.SingleOrDefaultAsync(m => m.Id == id);

            if (marketingList == null)
            {
                return NotFound();
            }

            var user = await userManager.GetCurrentUserAsync();

            if (!user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name)) &&
                (!user.DepartmentId.HasValue || !user.Department.Name.Contains("маркетинг")))
                return StatusCode(403);

            marketingList.IsVisible = false;
            marketingList.ChangedByUserId = user.Id;
            marketingList.ChangedDate = DateTime.Now;
            await applicationContext.SaveChangesAsync();

            return Ok(marketingList);
        }

        [NonAction]
        private async Task UpdateContactsForMarketingList(Guid[] contactIds, MarketingList marketingList, bool needToClear = false)
        {
            if (needToClear)
            {
                var contacts = applicationContext.MarketingListContact.Where(c => c.MarketingListId == marketingList.Id);

                applicationContext.MarketingListContact.RemoveRange(contacts);
            }

            var marketingLists = new MarketingListContact[contactIds.Length];

            for (var i = 0; i < contactIds.Length; i++)
            {
                var contact = await applicationContext.Contacts.SingleOrDefaultAsync(l => l.Id == contactIds[i]);

                marketingLists[i] = new MarketingListContact { Contact = contact, ContactId = contact.Id, MarketingList = marketingList, MarketingListId = marketingList.Id};
            }

            await applicationContext.MarketingListContact.AddRangeAsync(marketingLists);
        }

        [NonAction]
        private async Task<bool> MarketingListExistsAsync(Guid id)
        {
            return await applicationContext.MarketingList.AnyAsync(e => e.Id == id);
        }
    }
}
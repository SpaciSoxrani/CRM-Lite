using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.API.Utilities;
using CRM.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.Data;
using CRM.Data.Dtos.Contact;
using CRM.Data.Dtos.MarketingList;
using CRM.Data.Models.Marketing.MarketingList;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Memory;
using Vostok.Logging.Abstractions;
using System.Runtime.InteropServices;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/Contacts")]
    [Authorize]
    public class ContactsController : Controller
    {
        private readonly ApplicationContext context;
        private readonly IAccessManager accessManager;
        private readonly IBackgroundJobClient backgroundJob;
        private readonly IMapper mapper;
        private readonly UserManager userManager;
        private readonly ILog log;
        private readonly IMemoryCache cache;

        private readonly HashSet<string> fullAccessRoleNames = new HashSet<string>
        {
            "Администратор",
            "TOP-менеджер",
            "Менеджер по СМК"
        };

        public ContactsController
            (ApplicationContext context,
             IMapper mapper,
             UserManager userManager,
             IAccessManager accessManager,
             ILog log,
             IMemoryCache cache,
             IBackgroundJobClient backgroundJob)
        {
            this.context = context;
            this.accessManager = accessManager;
            this.backgroundJob = backgroundJob;
            this.userManager = userManager;
            this.mapper = mapper;
            this.cache = cache;
            this.log = log;
        }

        [HttpGet]
        public async Task<ActionResult<ContactDto[]>> AllContacts()
        {
            var contacts = await context.Contacts.ToArrayAsync();

            return mapper.Map<ContactDto[]>(contacts);
        }

        [HttpGet("Organizations/{id}")]
        public async Task<ActionResult<ContactShortDto[]>> ContactsByOrganizationId([FromRoute] Guid id)
        {
            var contacts = await context.Contacts
                  .Include(con => con.ResponsibleUser)
                  .Select(e => new ContactShortDto
                  {
                      Id = e.Id,
                      DisplayName = e.DisplayName,
                      OrganizationId = e.OrganizationId,
                      ResponsibleName = e.ResponsibleUser.DisplayName
                  }).Where(c => c.OrganizationId == id).ToArrayAsync();

            return Ok(mapper.Map<ContactShortDto[]>(contacts));
        }

        [HttpGet("WithoutOrganization")]
        public async Task<ActionResult<ContactShortDto[]>> ContactsWithoutOrganization()
        {
            var contacts = await context.Contacts
                   .Include(con => con.ResponsibleUser)
                   .Select(e => new ContactShortDto
                   {
                       Id = e.Id,
                       DisplayName = e.DisplayName,
                       OrganizationId = e.OrganizationId,
                       ResponsibleName = e.ResponsibleUser.DisplayName
                   }).Where(c => c.OrganizationId == null).ToArrayAsync();

            return Ok(mapper.Map<ContactShortDto[]>(contacts));
        }

        [HttpGet("ForList")]
        public async Task<ActionResult<ContactForListDto[]>> ContactsForListAsync()
        {
            var contacts = await context.Contacts
                .Include(c => c.ResponsibleUser)
                .Include(c => c.Address)
                .Include(c => c.Organization)
                .Select(e => new ContactForListDto {
                    Id = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    MiddleName = e.MiddleName,
                    OrganizationShortName = e.Organization.ShortName,
                    ResponsibleName = e.ResponsibleUser.DisplayName
            }).ToArrayAsync();

            return Ok(mapper.Map<ContactForListDto[]>(contacts));
        }
              

        [HttpGet("ForMarketingList")]
        public async Task<ActionResult<ContactForMarketingListDto[]>> ContactsForMarketingListAsync([FromQuery] ContactSearchForMarketingListDto contactSearchDto)
        {
            var contacts = await context.Contacts
                .Include(c => c.Address)
                .Include(c => c.Present)
                .Include(c => c.Organization).ThenInclude(o => o.ResponsibleUser).ThenInclude(o => o.Department).ThenInclude(o => o.ParentDepartment)
                .Include(c => c.ResponsibleUser).ThenInclude(o => o.Department).ThenInclude(o => o.ParentDepartment)
                .Where(c => !contactSearchDto.GenderId.HasValue || c.GenderId == contactSearchDto.GenderId)
                .Where(c => !contactSearchDto.RoleId.HasValue || c.RoleId == contactSearchDto.RoleId)
                .Where(c => contactSearchDto.OrganizationIds.Length == 0 || c.OrganizationId != null && contactSearchDto.OrganizationIds.Contains(c.OrganizationId.Value))
                .Where(c => !contactSearchDto.IndustryId.HasValue || !c.OrganizationId.HasValue || c.Organization.IndustryId == contactSearchDto.IndustryId)
                .ToListAsync();

            var filteredContacts = contacts
                .Where(c => string.IsNullOrWhiteSpace(contactSearchDto.Town) || c.Address.City.Contains(contactSearchDto.Town, StringComparison.OrdinalIgnoreCase))
                .Where(c => string.IsNullOrWhiteSpace(contactSearchDto.Name) || c.DisplayName.Contains(contactSearchDto.Name, StringComparison.OrdinalIgnoreCase))
                .ToArray();

            return Ok(mapper.Map<ContactForMarketingListDto[]>(filteredContacts));
        }

        [HttpGet("Organizations/{id}/ForInterest")]
        public async Task<ActionResult<ContactForInterestDto[]>> ContactsForInterestAsync([FromRoute] Guid id)
        {
            var contacts = await context.Contacts.Where(c => c.OrganizationId == id).ToArrayAsync();

            return Ok(mapper.Map<ContactForInterestDto[]>(contacts));
        }

        [HttpGet("DeliveryInfo/{id}")]
        public async Task<ActionResult<MarketingListDeliveryAndPresentInfo>> GetDeliveryInfoAsync([FromRoute] Guid id)
        {
            var contact = await context.Contacts.SingleOrDefaultAsync(c => c.Id == id);

            return Ok(mapper.Map<MarketingListDeliveryAndPresentInfo>(contact));
        }

        [HttpGet("Short")]
		public async Task<ActionResult<ContactShortDto[]>> ContactsShortAsync()
		{
            if (!cache.TryGetValue("shortContacts", out Contact[] contacts))
            {
                contacts = await context.Contacts.ToArrayAsync();

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromMinutes(10));

                cache.Set("shortContacts", contacts, cacheEntryOptions);
            }

            return mapper.Map<ContactShortDto[]>(contacts);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ContactDto>> GetContactAsync([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)            
                return BadRequest(ModelState);            

            var contact = await context.Contacts
                .Include(c => c.ResponsibleUser).ThenInclude(c => c.Department)
                .Include(c => c.Address)
                .Include(c => c.MarketingListContacts)
                .SingleOrDefaultAsync(m => m.Id == id);

            if (contact == null)            
                return NotFound();            

            return Ok(mapper.Map<ContactDto>(contact));
        }

        [HttpGet("SearchForDuplicate")]
        public async Task<ActionResult<ContactForListDto[]>> SearchContactByNameTownMobPhoneAsync([FromQuery] string firstName, string lastName, string city, string mobilePhone)
        {
            var contacts = await context.Contacts
                .Include(c => c.Address)
                .Include(c => c.Organization)
                .Where(m => m.FirstName == firstName && m.LastName == lastName &&
                            m.AddressId != null &&
                            m.Address.City == city && (string.IsNullOrEmpty(mobilePhone) && string.IsNullOrEmpty(m.MobilePhone) ||
                                                       m.MobilePhone == mobilePhone)).ToArrayAsync();

            log.Info(" Duplicate contacts are " + string.Join(' ', contacts.Select(c => c.Id)));

            if (!contacts.Any())
                return Ok(new ContactForListDto[0]);

            return Conflict(mapper.Map<ContactForListDto[]>(contacts));
        }

        [HttpPut("ChangeMarketingInfo/{id}")]
        public async Task<ActionResult<ContactForMarketingListDto[]>> ChangeMarketingInfoAsync([FromRoute] Guid id, [FromBody] ContactMarketingInfoUpdateDto contactMarketingInfoUpdateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != contactMarketingInfoUpdateDto.Id)
                return BadRequest();

            var user = await userManager.GetCurrentUserAsync();

            log.Error(user.DisplayName + "Edit marketing ContactInfo");

            var contact = await context.Contacts
                .SingleOrDefaultAsync(m => m.Id == id);

            contact.ChangedByUserId = user.Id;
            contact.ChangedDate = DateTime.Now;

            contact.PresentId = contactMarketingInfoUpdateDto.PresentId;
            contact.IsNeedToDeliver = contactMarketingInfoUpdateDto.NeedToDeliver;
            contact.DeliverAddress = contactMarketingInfoUpdateDto.Address;
            contact.DeliverIndex = contactMarketingInfoUpdateDto.Index;
            contact.DeliverPhoneNumber = contactMarketingInfoUpdateDto.Phone;
            contact.DeliverContactName = contactMarketingInfoUpdateDto.ContactName;

            try
            {
                await context.SaveChangesAsync();

                contact = await context.Contacts
                    .Include(c => c.Address)
                    .Include(c => c.Present)
                    .Include(c => c.Organization).ThenInclude(o => o.ResponsibleUser).ThenInclude(o => o.Department).ThenInclude(o => o.ParentDepartment)
                    .Include(c => c.ResponsibleUser).ThenInclude(o => o.Department).ThenInclude(o => o.ParentDepartment)
                    .SingleOrDefaultAsync(m => m.Id == id);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await ContactExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return Ok(mapper.Map<ContactForMarketingListDto>(contact));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> EditContactAsync([FromRoute] Guid id, [FromBody] ContactDto contactDto)
        {
            if (!ModelState.IsValid)            
                return BadRequest(ModelState);            

            if (id != contactDto.Id)            
                return BadRequest();

            var user = await userManager.GetCurrentUserAsync();

            var hasAccess = await accessManager.HasAccessToEditContactAsync(user.Id, id);

            if (!hasAccess)
                return StatusCode(403);

            var contact = mapper.Map<Contact>(contactDto);
            var address = mapper.Map<Address>(contactDto.Address);

            contact.ChangedByUserId = user.Id;
            contact.ChangedDate = DateTime.Now;

            context.Entry(contact).State = EntityState.Modified;
            context.Entry(address).State = EntityState.Modified;

            try
            {
                await context.SaveChangesAsync();

                await UpdateMailingListsAsync(contactDto.MarketingListContactIds, contact, true);

                await context.SaveChangesAsync();

                var editedContact = await context.Contacts
                    .Include(c => c.Deals)
                    .SingleOrDefaultAsync(c => c.Id == contact.Id);

                var contactDeals = editedContact.Deals.Select(d => d.Id).ToList();

                backgroundJob.Enqueue(() => accessManager.UpdateAccessForEntitiesAsync(contactDeals));
                cache.Remove("shortContacts");

                log.Info($"Contact {contact.DisplayName} ({contact.Id}) was edited by user: {user.DisplayName} ({user.Id})");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await ContactExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult> CreateContactAsync([FromBody] ContactDto contactDto)
        {
            var user = await userManager.GetCurrentUserAsync();

            if (!ModelState.IsValid)
            {
                log.Error($"Invalid saving of contact. User: {user.DisplayName} ({user.Id})");
                return BadRequest(ModelState);
            }

            var address = mapper.Map<Address>(contactDto.Address);
            var contact = mapper.Map<Contact>(contactDto);

            contact.Address = address;

            contact.CreatedByUserId = user.Id;
            contact.CreatedDate = DateTime.Now;

            await context.Contacts.AddAsync(contact);

            await UpdateMailingListsAsync(contactDto.MarketingListContactIds, contact);

            await context.SaveChangesAsync();

            log.Info($"Contact {contact.DisplayName} ({contact.Id}) was created by user: {user.DisplayName} ({user.Id})");

            cache.Remove("shortContacts");
            return CreatedAtAction("CreateContactAsync", new { id = contact.Id }, contact);
        }

        private async Task UpdateMailingListsAsync(Guid[] marketingListIds, Contact contact, bool needToClearLists = false)
        {
            if (needToClearLists)
            {
                var lists = context.MarketingListContact.Where(c => c.ContactId == contact.Id);

                context.MarketingListContact.RemoveRange(lists);
            }

            var marketingLists = new MarketingListContact[marketingListIds.Length];

            for (var i = 0; i < marketingListIds.Length; i++)
            {
                var marketingList = await context.MarketingList.SingleOrDefaultAsync(l => l.Id == marketingListIds[i]);

                marketingLists[i] = new MarketingListContact { Contact = contact, MarketingList = marketingList };
            }

            await context.MarketingListContact.AddRangeAsync(marketingLists);
        }

        [HttpPut("MakeInvisible/{id}")]
        public async Task<ActionResult> MakeInvisibleAsync([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var contact = await context.Contacts
                .Include(c => c.ResponsibleUser)
                .SingleOrDefaultAsync(m => m.Id == id);

            if (contact == null)
            {
                return NotFound();
            }

            var user = await userManager.GetCurrentUserAsync();

            if (!user.UserRoles.Any(ur => fullAccessRoleNames.Contains(ur.Role.Name)) &&
                contact.ResponsibleUserId != user.Id &&
                contact.ResponsibleUser?.ManagerId != user.Id)
                return StatusCode(403);

            contact.IsVisible = false;
            contact.ChangedByUserId = user.Id;
            contact.ChangedDate = DateTime.Now;

            await context.SaveChangesAsync();

            cache.Remove("shortContacts");

            log.Info($"Contact {contact.DisplayName} ({contact.Id}) was deleted by user: {user.DisplayName} ({user.Id})");

            return Ok(contact);
        }

        [HttpGet]
		public async Task<bool> ContactExists(Guid id)
        {
            return await context.Contacts.AnyAsync(e => e.Id == id);
        }
    }
}
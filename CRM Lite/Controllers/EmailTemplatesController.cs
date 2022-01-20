using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.API.Utilities;
using CRM.API.Utilities.EMailServices;
using CRM.Data;
using CRM.Data.Dtos.MarketingList;
using CRM.Data.Dtos.MarketingList.MarketingListTemplate;
using CRM.Data.Models.Marketing.MarketingListTemplate;
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
    public class EmailTemplatesController : ControllerBase
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

        public EmailTemplatesController(ApplicationContext applicationContext, UserManager userManager, ILog log, IMapper mapper, IMjmlServices mjmlServices, IEmailSender emailSender)
        {
            this.applicationContext = applicationContext;
            this.userManager = userManager;
            this.emailSender = emailSender;
            this.mjmlServices = mjmlServices;
            this.log = log;
            this.mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<MarketingEmailTemplateForListDto[]>> GetTemplatesAsync()
        {
            var templates = await applicationContext.MarketingEmailTemplates
                .Include(t => t.CreatedByUser)
                .ToArrayAsync();

            return mapper.Map<MarketingEmailTemplateForListDto[]>(templates);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MarketingEmailTemplateWithElementsDto>> GetTemplateAsync([FromRoute] Guid id)
        {
            var template = await applicationContext.MarketingEmailTemplates
                .Include(t => t.AllTemplateElements)
                .SingleOrDefaultAsync(m => m.Id == id);

            return mapper.Map<MarketingEmailTemplateWithElementsDto>(template);
        }

        [HttpPost("SendTestEmailWithMjml")]
        public async Task<ActionResult> SendTestEmailAsync([FromBody] TestMjmlEmailDto mjmlEmailDto)
        {
            log.Info("Test email with mjml start Creating");
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var user = await userManager.GetCurrentUserAsync();

            var toEmailList = new List<string> { user.Email };
            var mjml = $@"<mjml>
<mj-head>
    <mj-title>Say hello to card</mj-title>
    <mj-attributes>
      <mj-text font-weight=""400"" font-size=""16px"" color=""#000000"" line-height=""24px"" padding-top=""10px""></mj-text>
      <mj-section padding=""0px""></mj-section>
    </mj-attributes>
  </mj-head>
  <mj-body>
   {mjmlEmailDto.MjmlText}
  </mj-body>
</mjml>";
            var result = await mjmlServices.Render(mjml);
            var body = result.Html;

            var subject = string.IsNullOrWhiteSpace(mjmlEmailDto.EmailTheme) ? "Без темы" : mjmlEmailDto.EmailTheme;
            await emailSender.SendAsync(toEmailList, new List<string>(), subject, body, "", true);

            log.Info("Test email was sent");
            return Ok();
        }

        [HttpPost("SaveEmailTemplate")]
        public async Task<ActionResult> SaveEmailTemplateAsync([FromBody] MarketingEmailTemplateCreateDto templateEmailDto)
        {
            log.Info("Email Template Start Saving");
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var template = mapper.Map<MarketingEmailTemplate>(templateEmailDto);

            var user = await userManager.GetCurrentUserAsync();

            template.CreatedByUserId = user.Id;
            template.CreatedDate = DateTime.Now;

            await applicationContext.MarketingEmailTemplates.AddAsync(template);

            await CreateElementsForTemplateAsync(templateEmailDto.Elements, template.Id);

            await applicationContext.SaveChangesAsync();

            log.Info("Email Template was saved");
            return CreatedAtAction("SaveEmailTemplateAsync", new { id = template.Id }, template);
        }

        [HttpPut("UpdateEmailTemplate/{id}")]
        public async Task<ActionResult> UpdateEmailTemplateAsync([FromRoute] Guid id, [FromBody] MarketingEmailTemplateUpdateDto templateEmailDto)
        {
            log.Info("Email Template Start Updating");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != templateEmailDto.Id)
                return BadRequest();

            var oldTemplate = await applicationContext.MarketingEmailTemplates.AsNoTracking().SingleOrDefaultAsync(t => t.Id == id);

            var template = mapper.Map<MarketingEmailTemplate>(templateEmailDto);

            var user = await userManager.GetCurrentUserAsync();

            template.CreatedByUserId = user.Id;
            template.CreatedDate = DateTime.Now;

            applicationContext.Entry(template).State = EntityState.Modified;

            try
            {
                await applicationContext.SaveChangesAsync();

                await UpdateElementsForTemplateAsync(templateEmailDto.Elements, template.Id);

                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await TemplateExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            log.Info("Email Template was updated");

            return NoContent();
        }

        [HttpPost("SendEmailWithMjml")]
        public async Task<ActionResult> SendTestEmailAsync([FromBody] MjmlEmailDto mjmlEmailDto)
        {
            log.Info("Test email with mjml start Creating");
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var toEmailList = mjmlEmailDto.AdditionalReceiverEmails.ToList();

            for (var i = 0; i < mjmlEmailDto.MarketingListIds.Length; i++)
            {
                var mlId = mjmlEmailDto.MarketingListIds[i];
                var marketingList = await applicationContext.MarketingList
                    .Include(ml => ml.MarketingListContacts)
                    .ThenInclude(m => m.Contact)
                    .SingleOrDefaultAsync(ml => ml.Id == mlId);

                if (marketingList == null)
                {
                    log.Error($"Invalid Guid in SendEmailWithMjml {mlId}");
                    return NotFound($"Guid {mlId} was not found");
                }

                foreach (var marketingListMarketingListContact in marketingList.MarketingListContacts)
                {
                    if (!string.IsNullOrWhiteSpace(marketingListMarketingListContact.Contact.Email))
                        toEmailList.Add(marketingListMarketingListContact.Contact.Email);
                }
            }

            var mjml = $@"<mjml>
<mj-head>
    <mj-title>Say hello to card</mj-title>
    <mj-attributes>
      <mj-text font-weight=""400"" font-size=""16px"" color=""#000000"" line-height=""24px""></mj-text>
      <mj-section padding=""0px""></mj-section>
    </mj-attributes>
  </mj-head>
  <mj-body>
   {mjmlEmailDto.MjmlText}
  </mj-body>
</mjml>";
            var result = await mjmlServices.Render(mjml);
            var body = result.Html;

            var subject = string.IsNullOrWhiteSpace(mjmlEmailDto.EmailTheme) ? "Без темы" : mjmlEmailDto.EmailTheme;
            await emailSender.SendAsync(toEmailList, new List<string>(), subject, body, "", true);

            log.Info("Test email was sent");
            return Ok();
        }

        [NonAction]
        private async Task CreateElementsForTemplateAsync(MarketingEmailTemplateCreateElementDto[] elements, Guid templateId)
        {
            var emailTemplateElements = new MarketingEmailTemplateElement[elements.Length];

            for (var i = 0; i < elements.Length; i++)
            {
                var newElement = mapper.Map<MarketingEmailTemplateElement>(elements[i]);
                newElement.TemplateId = templateId;

                emailTemplateElements[i] = newElement;
            }

            await applicationContext.MarketingEmailTemplateElements.AddRangeAsync(emailTemplateElements);
        }

        [NonAction]
        private async Task UpdateElementsForTemplateAsync(MarketingEmailTemplateUpdateElementDto[] elements, Guid templateId)
        {
            var templates = await applicationContext.MarketingEmailTemplates
                .Include(t => t.AllTemplateElements)
                .SingleOrDefaultAsync(c => c.Id == templateId);

            applicationContext.MarketingEmailTemplateElements.RemoveRange(templates.AllTemplateElements);
            
            var emailTemplateElements = new MarketingEmailTemplateElement[elements.Length];

            for (var i = 0; i < elements.Length; i++)
            {
                var newElement = mapper.Map<MarketingEmailTemplateElement>(elements[i]);
                newElement.TemplateId = templateId;

                emailTemplateElements[i] = newElement;
            }

            await applicationContext.MarketingEmailTemplateElements.AddRangeAsync(emailTemplateElements);
        }

        [NonAction]
        public async Task<bool> TemplateExists(Guid id)
        {
            return await applicationContext.MarketingEmailTemplates.AnyAsync(e => e.Id == id);
        }
    }
}
using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using CRM.API.Data;
using CRM.API.Services;
using CRM.API.Utilities;
using CRM.API.Utilities.ReportManager;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.Data.Dtos.Lead;
using CRM.Data.Models.Lead;
using Microsoft.AspNetCore.Authorization;
using Vostok.Logging.Abstractions;
using Newtonsoft.Json.Linq;
using Microsoft.AspNetCore.Http;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/Leads")]
    [Authorize]
    public class LeadsController : Controller
    {
        private readonly IAccessManager accessManager;
        private readonly ILeadReport leadReport;
        private readonly ILeadServices leadServices;
        private readonly IMapper mapper;
        private readonly UserManager userManager;
        private readonly ILog log;

        public LeadsController(
            IMapper mapper,
            UserManager userManager,
            IAccessManager accessManager,
            ILeadReport leadReport,
            ILog log,
            ILeadServices leadServices)
        {
            this.accessManager = accessManager;
            this.leadReport = leadReport;
            this.leadServices = leadServices;
            this.userManager = userManager;
            this.mapper = mapper;
            this.log = log;
        }

        [HttpGet("LeadAccesses/{userId:guid}")]
        public async Task<ActionResult<(bool hasAccessToRead, bool hasAccessToEdit)>> GetLeadAccessesAsync(
            CancellationToken cancellationToken,
            [FromRoute] Guid userId)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' checks access to leads", user.FullName);

            return Ok(await leadServices.GetAccessesAsync(cancellationToken, userId));
        }

        [HttpGet("GetLeadRept")]
        public async Task<ActionResult<FileStreamResult>> GetLeadReportAsync(CancellationToken cancellationToken)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' gets lead report", user.FullName);

            return Ok(await leadReport.CreateLeadReportAsync(cancellationToken));
        }

        [HttpGet("LeadStatuses")]
        public async Task<ActionResult<LeadStatusDto[]>> GetLeadStatusesAsync(CancellationToken cancellationToken)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' gets all lead statuses", user.FullName);

            var leadStatuses = await leadServices.GetStatusesAsync(cancellationToken);
            if (leadStatuses == null)
            {
                log.Warn("Lead statuses not found");
                return NotFound();
            }

            log.Debug("{LeadStatusesCount} leads statuses returned", leadStatuses.Length);

            var leadStatusesDto = mapper.Map<LeadStatusDto[]>(leadStatuses);
            log.Debug("Lead statuses mapped successfully");

            return Ok(leadStatusesDto);
        }

        [HttpGet("LeadTargets")]
        public async Task<ActionResult<LeadTargetDto[]>> GetLeadTargetsAsync(CancellationToken cancellationToken)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' gets all lead targets", user.FullName);

            var leadTargets = await leadServices.GetTargetsAsync(cancellationToken);
            if (leadTargets == null)
            {
                log.Warn("Lead targets not found");
                return NotFound();
            }

            log.Debug("{LeadTargetsCount} leads targets returned", leadTargets.Length);

            var leadTargetsDto = mapper.Map<LeadTargetDto[]>(leadTargets);
            log.Debug("Lead targets mapped successfully");

            return Ok(leadTargetsDto);
        }

        [HttpGet("LeadProjects")]
        public async Task<ActionResult<LeadProjectDto[]>> GetLeadProjectsAsync(CancellationToken cancellationToken)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' gets all lead projects", user.FullName);

            var leadProjects = await leadServices.GetProjectsAsync(cancellationToken);
            if (leadProjects == null)
            {
                log.Warn("Lead projects not found");
                return NotFound();
            }

            log.Debug("{LeadProjectsCount} leads projects returned", leadProjects.Length);

            var leadProjectsDto = mapper.Map<LeadProjectDto[]>(leadProjects);
            log.Debug("Lead projects mapped successfully");

            return Ok(leadProjectsDto);
        }

        [HttpGet("ForLeadsTable")]
        public async Task<ActionResult<LeadDto[]>> GetForLeadsTableAsync(CancellationToken cancellationToken)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' gets all leads", user.FullName);

            var hasAccess = await accessManager.HasAccessToReadLeadListAsync(user.Id);
            if (!hasAccess)
            {
                log.Info("User: '{UserFullName}' has no read access", user.FullName);
                return StatusCode(StatusCodes.Status403Forbidden);
            }

            log.Info("User: '{UserFullName}' has read access", user.FullName);

            var leads = await leadServices.GetAllAsync(cancellationToken);
            if (leads == null)
            {
                log.Warn("Leads not found");
                return NotFound();
            }

            log.Debug("{LeadsCount} leads returned", leads.Length);

            var leadsDto = mapper.Map<LeadDto[]>(leads);
            log.Debug("Leads mapped successfully");

            return Ok(leadsDto);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LeadDto>> GetLeadAsync(
            CancellationToken cancellationToken,
            [FromRoute] Guid id)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' gets lead: {LeadId}", user.FullName, id);

            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var lead = await leadServices.GetAsync(cancellationToken, id);
            if (lead == null)
            {
                log.Warn("Lead not found, lead id: {Id}", id);

                return NotFound();
            }

            log.Debug("Lead found, lead id: {Id}", id);

            var leadDto = mapper.Map<LeadDto>(lead);
            log.Debug("Lead mapped successfully");

            return Ok(leadDto);
        }

        [HttpGet("LeadAccess")]
        public async Task<ActionResult<LeadAccessListDto[]>> GetLeadAccessAsync(CancellationToken cancellationToken)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' gets all lead access list", user.FullName);

            var hasAccess = await accessManager.HasAccessToEditLeadListAsync(user.Id);

            if (!hasAccess)
            {
                log.Info("User: '{UserFullName}' has no edit access", user.FullName);

                return StatusCode(StatusCodes.Status403Forbidden);
            }

            log.Info("User: '{UserFullName}' has edit access", user.FullName);

            var accessList = await leadServices.GetAccessesAsync(cancellationToken);
            log.Debug("{AccessListLength} accesses returned", accessList.Length);

            var accessListDto = mapper.Map<LeadAccessListDto[]>(accessList);
            log.Debug("Access list mapped successfully");

            return Ok(accessListDto);
        }

        [HttpPut("EditLeadAccess")]
        public async Task<IActionResult> EditLeadAccessAsync(CancellationToken cancellationToken, [FromBody] JObject accessContract)
        {
            var targetUserId = (Guid)accessContract.GetValue("userId");
            var isAbleToEdit = (bool)accessContract.GetValue("isAbleToEdit");

            var user = await userManager.GetCurrentUserAsync();
            log.Info(
                "User: '{UserFullName}' edits lead access for user: {TargetUserId} to be able to edit: '{IsAbleToEdit}'",
                user.FullName,
                targetUserId,
                isAbleToEdit);

            var targetUser = await leadServices.GetUserAccessAsync(cancellationToken, targetUserId, isAbleToEdit);
            if (targetUser == null)
            {
                log.Warn("Not found lead access, target user id: {TargetUserId}", targetUserId);

                return NotFound();
            }

            log.Debug(
                "Found lead access for user: {TargetUserFullName} ({TargetUserId}) with able to edit: '{TargetUserIsAbleToEdit}'",
                targetUser.User.FullName,
                targetUserId,
                targetUser.IsAbleToEdit);

            await leadServices.EditUserAccessAsync(cancellationToken, targetUser);
            log.Info(
                "Lead access for user: {TargetUserFullName} ({TargetUserId}) was edited by user: '{UserFullName}'",
                targetUser.User.FullName,
                targetUserId,
                user.FullName);

            return StatusCode(StatusCodes.Status201Created, "success");
        }

        [HttpPut("EditLead/{id}")]
        public async Task<ActionResult> EditLeadAsync(
            CancellationToken cancellationToken,
            [FromRoute] Guid id,
            [FromBody] LeadDto leadDto)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' edits lead, lead id: {Id}", user.FullName, id);

            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            if (id != leadDto.Id)
            {
                log.Error("Id: {Id} does not match id Dto: {LeadDtoId}", id, leadDto.Id);
                return BadRequest();
            }

            var hasAccess = await accessManager.HasAccessToEditLeadListAsync(user.Id);
            if (!hasAccess)
            {
                log.Info("User: '{UserFullName}' has no edit access", user.FullName);
                return StatusCode(StatusCodes.Status403Forbidden);
            }

            log.Info("User: '{UserFullName}' has edit access", user.FullName);

            var lead = mapper.Map<Lead>(leadDto);
            log.Debug("Lead mapped successfully");

            try
            {
                lead = await leadServices.EditAsync(cancellationToken, leadDto, lead, user, ApiFrontStore.FrontUrl[Request.Host.Value]);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await LeadExistsAsync(cancellationToken, id))
                {
                    return NotFound();
                }

                throw;
            }

            log.Info("Lead: {LeadId} was edited by user: '{UserFullName}'", lead.Id, user.FullName);
            return Ok(lead);
        }

        [HttpPut("DeleteLead/{id}")]
        public async Task<ActionResult> DeleteLeadAsync(CancellationToken cancellationToken, [FromRoute] Guid id)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' deletes lead, lead id: {Id}", user.FullName, id);

            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var hasAccess = await accessManager.HasAccessToEditLeadListAsync(user.Id);
            if (!hasAccess)
            {
                log.Info("User: '{UserFullName}' has no edit access", user.FullName);
                return StatusCode(StatusCodes.Status403Forbidden);
            }

            log.Info("User: '{UserFullName}' has edit access", user.FullName);

            var lead = await leadServices.GetAsync(cancellationToken, id);
            if (lead == null)
            {
                log.Warn("Lead not found, lead id: {Id}", id);
                return NotFound();
            }

            log.Debug("Lead found, lead id: {Id}", id);

            lead = await leadServices.DeleteAsync(cancellationToken, lead, user);

            log.Info("Lead: {LeadId} was deleted by user: '{UserFullName}'", lead.Id, user.FullName);
            return Ok(lead);
        }

        [HttpPost("AddLeadAccess")]
        public async Task<IActionResult> AddLeadAccessAsync(CancellationToken cancellationToken, [FromBody] JObject accessContract)
        {
            var isAbleToEdit = (bool)accessContract.GetValue("isAbleToEdit");
            var usersToAccess = accessContract.GetValue("usersToAccess")?[0];

            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' adds lead access to be able to edit: '{IsAbleToEdit}'", user.FullName, isAbleToEdit);

            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var hasAccess = await accessManager.HasAccessToEditLeadListAsync(user.Id);

            if (!hasAccess)
            {
                log.Info("User: '{UserFullName}' has no edit access", user.FullName);
                return StatusCode(StatusCodes.Status403Forbidden);
            }

            log.Info("User: '{UserFullName}' has edit access", user.FullName);

            if (usersToAccess == null)
            {
                log.Warn("No users who need to give access");

                return NotFound();
            }

            var updateAccess = await leadServices.AddAccessesAsync(
                cancellationToken,
                user,
                isAbleToEdit,
                usersToAccess);

            log.Info("Lead accesses was added by user: '{UserFullName}'", user.FullName);

            if (updateAccess.Count > 0)
                return StatusCode(StatusCodes.Status201Created, updateAccess);

            return StatusCode(StatusCodes.Status201Created, "success");
        }

        [HttpPost("CreateLead")]
        public async Task<ActionResult> CreateLeadAsync(CancellationToken cancellationToken, [FromBody] LeadDto leadDto)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' creates lead", user.FullName);

            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var hasAccess = await accessManager.HasAccessToEditLeadListAsync(user.Id);
            if (!hasAccess)
            {
                log.Info("User: '{UserFullName}' has no edit access", user.FullName);
                return StatusCode(StatusCodes.Status403Forbidden);
            }

            log.Info("User: '{UserFullName}' has edit access", user.FullName);

            var lead = mapper.Map<Lead>(leadDto);
            log.Debug("Leads mapped successfully");

            lead = await leadServices.CreateAsync(cancellationToken, lead, user);

            log.Info("Lead: {LeadId} was created by user: '{UserFullName}'", lead.Id, user.FullName);
            return CreatedAtAction("CreateLead", new {id = lead.Id}, lead);
        }

        [HttpDelete("DeleteLeadAccess/{targetUserId}")]
        public async Task<IActionResult> DeleteLeadAccessAsync(CancellationToken cancellationToken, Guid targetUserId)
        {
            var user = await userManager.GetCurrentUserAsync();
            log.Info("User: '{UserFullName}' deletes lead access for user: {TargetUserId}", user.FullName, targetUserId);

            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var hasAccess = await accessManager.HasAccessToEditLeadListAsync(user.Id);

            if (!hasAccess)
            {
                log.Info("User: '{UserFullName}' has no edit access", user.FullName);
                return StatusCode(StatusCodes.Status403Forbidden);
            }

            log.Info("User: '{UserFullName}' has edit access", user.FullName);

            var access = await leadServices.GetUserAccessListAsync(cancellationToken, targetUserId);
            
            if (access.Count == 0)
            {
                log.Debug("Not found accesses for user: {TargetUserId}", targetUserId);

                return NotFound();
            }
            log.Debug("{AccessListLength} accesses returned for user: {TargetUserId}", access.Count, targetUserId);
            
            await leadServices.DeleteAccessesAsync(cancellationToken, access);

            log.Info(
                "User: '{UserFullName}' deleted lead access for user {TargetUserId}",
                user.FullName,
                user.Id,
                targetUserId);

            return Ok("Deleted");
        }

        [HttpGet]
        public async Task<bool> LeadExistsAsync(CancellationToken cancellationToken, Guid id)
        {
            return await leadServices.ExistsAsync(cancellationToken, id);
        }
    }
}
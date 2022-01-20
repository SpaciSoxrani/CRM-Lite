using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.API.Data;
using CRM.API.Utilities;
using CRM.API.Utilities.EmailManagers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.Data;
using CRM.Data.Dtos.PreSale;
using CRM.Data.Models.PreSale;
using Microsoft.AspNetCore.Authorization;
using Vostok.Logging.Abstractions;
using Newtonsoft.Json.Linq;
using CRM.API.Utilities.ReportManager;
using Microsoft.AspNetCore.Http;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/PreSales")]
    [Authorize]
    public class PreSalesController : Controller
    {
        private readonly ApplicationContext context;
        private readonly IAccessManager accessManager;
        private readonly IReportManager reportManager;
        private readonly IEmailPreSaleManager emailManager;
        private readonly IMapper mapper;
        private readonly UserManager userManager;
        private readonly ILog log;

        public PreSalesController
            (ApplicationContext context,
             IMapper mapper,
             UserManager userManager,
             IAccessManager accessManager,
             IEmailPreSaleManager emailManager,
             ILog log,
             IReportManager reportManager)
        {
            this.context = context;
            this.accessManager = accessManager;
            this.reportManager = reportManager;
            this.userManager = userManager;
            this.emailManager = emailManager;
            this.mapper = mapper;
            this.log = log;
        }

        #region Pre-sale

        [HttpGet("PreSaleAccesses/{preSaleGroupId:guid}/{userId:guid}")]
        public async Task<ActionResult<(bool hasAccessToRead, bool hasAccessToEdit)>> GetLeadAccessesAsync(
            [FromRoute] Guid preSaleGroupId, [FromRoute] Guid userId)
        {
            var hasAccessToRead = await accessManager.HasAccessToReadPreSaleListAsync(userId, preSaleGroupId);
            var hasAccessToEdit = false;
            
            if(hasAccessToRead)
                hasAccessToEdit = await accessManager.HasAccessToEditPreSaleListAsync(userId, preSaleGroupId);

            return Ok((hasAccessToRead, hasAccessToEdit));
        }
        
        [HttpGet("GetPreSaleRept/{preSaleGroupId}")]
        [Authorize]
        public async Task<ActionResult> GetPreSaleReptAsync(Guid preSaleGroupId)
        {
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }
            
            var preSaleGroup = await context.PreSaleGroups
                .SingleOrDefaultAsync(psg => psg.Id == preSaleGroupId);

            if (preSaleGroup == null)
                return NotFound();
            
            var (stream, type, name) = await reportManager.GetPreSaleReportAsync(preSaleGroup);
            return File(stream, type, name);
        }

        [HttpGet]
        public async Task<ActionResult<PreSaleDto[]>> AllPreSales()
        {
            var preSales = await context.PreSales
                .Include(ps => ps.ResponsibleUser)
                .Include(ps => ps.Status)
                .ToArrayAsync();

            return mapper.Map<PreSaleDto[]>(preSales);
        }

        [HttpGet("PreSaleStatuses")]
        public async Task<ActionResult<PreSaleStatusDto[]>> GetPreSaleStatusesAsync()
        {
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleStatuses = await context.PreSaleStatuses
                .ToArrayAsync();

            return mapper.Map<PreSaleStatusDto[]>(preSaleStatuses);
        }

        [HttpGet("PreSaleResults")]
        public async Task<ActionResult<PreSaleResultDto[]>> GetPreSaleResultsAsync()
        {
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleResults = await context.PreSaleResults
                .ToArrayAsync();

            return mapper.Map<PreSaleResultDto[]>(preSaleResults);
        }

        [HttpGet("PreSaleRegions")]
        public async Task<ActionResult<PreSaleRegionDto[]>> GetPreSaleRegionsAsync()
        {
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleRegions = await context.PreSaleRegions
                .ToArrayAsync();

            return mapper.Map<PreSaleRegionDto[]>(preSaleRegions);
        }

        [HttpGet("ForPreSalesTable/{id}")]
        public async Task<ActionResult<PreSaleDto[]>> GetForPreSalesTableAsync([FromRoute] Guid id)
        {
            var user = await userManager.GetCurrentUserAsync();

            var hasAccess = await accessManager.HasAccessToReadPreSaleListAsync(user.Id, id);

            if (!hasAccess)
                return StatusCode(403);

            var preSalesInGroup = await context.PreSales
                .Include(ps => ps.Status)
                .Include(ps => ps.Result)
                .Include(ps => ps.Region)
                .Include(ps => ps.ResponsibleUser)
                .Include(ps => ps.Group)
                .Where(ps => ps.Group.Id == id)
                .ToArrayAsync();

            if (preSalesInGroup == null)
                return NotFound();

            var preSalesInGroupDto = Ok(mapper.Map<PreSaleDto[]>(preSalesInGroup));

            return preSalesInGroupDto;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PreSaleDto>> GetPreSaleAsync([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var preSale = await context.PreSales
                .SingleOrDefaultAsync(m => m.Id == id);

            if (preSale == null)
                return NotFound();

            return Ok(mapper.Map<PreSaleDto>(preSale));
        }

        [HttpPut("EditPreSale/{id}")]
        public async Task<ActionResult> EditPreSaleAsync([FromRoute] Guid id, [FromBody] PreSaleDto preSaleDto)
        {
            log.Info("Pre-sale start Edit");
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            if (id != preSaleDto.Id)
                return BadRequest();

            var user = await userManager.GetCurrentUserAsync();

            var hasAccess = await accessManager.HasAccessToEditPreSaleListAsync(user.Id, (Guid)preSaleDto.GroupId);

            if (!hasAccess)
                return StatusCode(403);

            var preSale = mapper.Map<PreSale>(preSaleDto);

            preSale.ChangedByUserId = user.Id;
            preSale.ChangedDate = DateTime.Now;

            context.Entry(preSale).State = EntityState.Modified;

            try
            {
                await context.SaveChangesAsync();

                var editedPreSale = await context.PreSales
                    .Include(ps => ps.Group)
                        .ThenInclude(psg => psg.Department)
                            .ThenInclude(d => d.Manager)
                    .Include(ps => ps.ResponsibleUser)
                        .ThenInclude(ru => ru.Manager)
                            .ThenInclude(m => m.Manager)
                    .Include(ps => ps.ResponsibleUser)
                        .ThenInclude(ru => ru.Department)
                            .ThenInclude(d => d.ParentDepartment)
                                .ThenInclude(pd => pd.Manager)
                    .Include(ps => ps.Region)
                    .Include(ps => ps.Result)
                    .SingleOrDefaultAsync(ps => ps.Id == preSale.Id);

                var href = "https://" + ApiFrontStore.FrontUrl[Request.Host.Value] + "/PreSales/PreSale/" + preSale.GroupId;

                if (preSaleDto.EditFieldName == "responsibleUser")
                {
                    await emailManager.SendMassageAboutAddPreSaleResponsibleUser(editedPreSale, href);
                }

                log.Info($"Pre-sale {preSale.FullName} ({preSale.Id}) was edited by user: {user.DisplayName} ({user.Id})");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await PreSaleExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return Ok(preSale);
        }

        [HttpPost("CreatePreSale")]
        public async Task<ActionResult> CreatePreSaleAsync([FromBody] PreSaleDto preSaleDto)
        {
            log.Info("Pre-sale start Create");
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var user = await userManager.GetCurrentUserAsync();

            var hasAccess = await accessManager.HasAccessToEditPreSaleListAsync(user.Id, (Guid)preSaleDto.GroupId);

            if (!hasAccess)
                return StatusCode(403);

            var preSale = mapper.Map<PreSale>(preSaleDto);

            preSale.CreatedByUserId = user.Id;
            preSale.CreatedDate = DateTime.Now;
            preSale.ChangedDate = preSale.CreatedDate;
            preSale.ChangedByUserId = preSale.CreatedByUserId = user.Id;

            await context.PreSales.AddAsync(preSale);

            await context.SaveChangesAsync();

            log.Info($"Pre-sale {preSale.Organization} ({preSale.Id}) in {preSale.GroupId}" +
                $" was created by user: {user.DisplayName} ({user.Id})");
            return CreatedAtAction("CreatePreSale", new { id = preSale.Id }, preSale);
        }

        [HttpPut("DeletePreSale/{id}")]
        public async Task<ActionResult> DeletePreSaleAsync([FromRoute] Guid id)
        {
            log.Info("Pre-sale start Delete");
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSale = await context.PreSales
                .Include(ps => ps.Status)
                .Include(ps => ps.Result)
                .Include(ps => ps.Region)
                .Include(ps => ps.ResponsibleUser)
                .Include(ps => ps.Group)
                .SingleOrDefaultAsync(psg => psg.Id == id);

            if (preSale == null)
                return NotFound();

            var user = await userManager.GetCurrentUserAsync();

            var hasAccess = await accessManager.HasAccessToEditPreSaleListAsync(user.Id, (Guid)preSale.GroupId);

            if (!hasAccess)
                return StatusCode(403);

            preSale.IsVisible = false;
            preSale.ChangedByUserId = user.Id;
            preSale.ChangedDate = DateTime.Now;

            await context.SaveChangesAsync();

            log.Info($"Pre-sale {preSale.FullName} ({preSale.Id}) was deleted by user: {user.DisplayName} ({user.Id})");

            return Ok(preSale);
        }

        [HttpGet]
        public async Task<bool> PreSaleExists(Guid id)
        {
            return await context.PreSales.AnyAsync(ps => ps.Id == id);
        }

        #endregion

        #region Pre-sale group

        [HttpGet("PreSaleGroupAccesses/{userId:guid}")]
        public async Task<ActionResult<(bool hasAccessToRead, bool hasAccessToEdit)>> GetLeadAccessesAsync([FromRoute] Guid userId)
        {
            var hasAccessToRead = await accessManager.HasAccessToReadPreSaleGroupListAsync(userId);
            var hasAccessToEdit = await accessManager.HasAccessToEditPreSaleGroupListAsync(userId);

            return Ok((hasAccessToRead, hasAccessToEdit));
        }
        
        [HttpGet("ForGroupsTable")]
        public async Task<ActionResult<PreSaleGroupDto[]>> GetForGroupsTableAsync()
        {
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var user = await userManager.GetCurrentUserAsync();

            var isCanRead = await accessManager.HasAccessToReadPreSaleGroupListAsync(user.Id)
                || await accessManager.HasAccessToEditPreSaleGroupListAsync(user.Id);

            var hasAccess = await context.PreSaleGroupAccessLists
                .AnyAsync(psg => psg.UserId == user.Id);

            if (!isCanRead && !hasAccess)
                return StatusCode(403);

            var isDepHeader = await context.Departments
                .Include(d => d.ParentDepartment)
                .Where(d => d.ParentDepartment == null)
                .AnyAsync(d => d.ManagerId == user.Id);


            PreSaleGroup[] preSaleGroups;

            if (isDepHeader && user.UserRoles.Any(ur => ur.Role.Name == "TOP-менеджер"))
            {
                preSaleGroups = await context.PreSaleGroups
                    .Include(psg => psg.Status)
                    .Include(psg => psg.Department)
                    .Where(psg => psg.Department.ManagerId == user.Id)
                    .ToArrayAsync();
            }
            else if (!isCanRead && hasAccess)
            {
                preSaleGroups = await context.PreSaleGroups
                    .Include(psg => psg.Status)
                    .Include(psg => psg.Department)
                    .Include(psg => psg.PreSaleGroupAccessLists)
                    .Where(psg => psg.PreSaleGroupAccessLists.Any(psgal => psgal.UserId == user.Id))
                    .ToArrayAsync();
            }
            else
            {
                preSaleGroups = await context.PreSaleGroups
                    .Include(psg => psg.Status)
                    .Include(psg => psg.Department)
                    .ToArrayAsync();
            }

            return mapper.Map<PreSaleGroupDto[]>(preSaleGroups);
        }

        [HttpGet("GroupAccess/{id}")]
        public async Task<ActionResult<PreSaleGroupAccessListDto[]>> GetGroupAccessAsync([FromRoute] Guid id)
        {
            var user = await userManager.GetCurrentUserAsync();

            var hasAccess = await accessManager.HasAccessToEditPreSaleListAsync(user.Id, id);

            if (!hasAccess)
                return StatusCode(403);

            var accessList = await context.PreSaleGroupAccessLists
                .Include(psgal => psgal.User)
                .Include(psgal => psgal.PreSaleGroup)
                .Where(psgal => psgal.PreSaleGroupId == id)
                .ToArrayAsync();

            return Ok(mapper.Map<PreSaleGroupAccessListDto[]>(accessList));
        }

        [HttpGet("PreSaleGroup/{id}")]
        public async Task<ActionResult<PreSaleGroupDto>> GetPreSaleGroupAsync([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleGroup = await context.PreSaleGroups
                .SingleOrDefaultAsync(psg => psg.Id == id);

            if (preSaleGroup == null)
                return NotFound();

            var user = await userManager.GetCurrentUserAsync();

            var hasAccess = await accessManager.HasAccessToReadPreSaleListAsync(user.Id, id);

            if (!hasAccess)
                return StatusCode(403);

            return Ok(mapper.Map<PreSaleGroupDto>(preSaleGroup));
        }

        [HttpGet("PreSaleGroupStatuses")]
        public async Task<ActionResult<PreSaleGroupStatusDto[]>> GetPreSaleGroupStatusesAsync()
        {
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleGroupStatuses = await context.PreSaleGroupStatuses
                .ToArrayAsync();

            return mapper.Map<PreSaleGroupStatusDto[]>(preSaleGroupStatuses);
        }

        [HttpPost("CreatePreSaleGroup")]
        public async Task<ActionResult> CreatePreSaleGroupAsync([FromBody] PreSaleGroupDto preSaleGroupDto)
        {
            log.Info("Pre-sale group start Create");
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var user = await userManager.GetCurrentUserAsync();

            var hasAccess = await accessManager.HasAccessToEditPreSaleGroupListAsync(user.Id);

            if (!hasAccess)
                return StatusCode(403);

            var preSaleGroup = mapper.Map<PreSaleGroup>(preSaleGroupDto);

            preSaleGroup.CreatedByUserId = user.Id;
            preSaleGroup.CreatedDate = DateTime.Now;
            preSaleGroup.ChangedDate = preSaleGroup.CreatedDate;
            preSaleGroup.ChangedByUserId = preSaleGroup.CreatedByUserId = user.Id;

            await context.PreSaleGroups.AddAsync(preSaleGroup);

            await context.SaveChangesAsync();

            log.Info($"Pre-sale group {preSaleGroup.Name} ({preSaleGroup.Id}) was created by user: {user.DisplayName} ({user.Id})");
            return CreatedAtAction("CreatePreSaleGroup", new { id = preSaleGroup.Id }, preSaleGroup);
        }

        [HttpPost("AddPreSaleGroupAccess")]
        public async Task<IActionResult> AddPreSaleGroupAccessAsync([FromBody] JObject accessContract)
        {
            var user = await userManager.GetCurrentUserAsync();

            var preSaleGroupId = (Guid)accessContract.GetValue("preSaleGroupId");
            var isAbleToEdit = (bool)accessContract.GetValue("isAbleToEdit");
            var usersToAccess = accessContract.GetValue("usersToAccess")[0];

            var preSaleGroup = await context.PreSaleGroups.AsNoTracking()
                .Include(d => d.Department)
                .SingleOrDefaultAsync(d => d.Id == preSaleGroupId);



            if (preSaleGroup == null || user == null)
                return StatusCode(422);

            var hasAccess = await accessManager.HasAccessToEditPreSaleListAsync(user.Id, preSaleGroupId);

            if (!hasAccess)
                return StatusCode(403);

            var updateAccess = new List<PreSaleGroupAccessList>();

            foreach (var userGuid in usersToAccess)
            {
                var userToAdd = await context.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == (Guid)userGuid);

                log.Info($"{user.FullName} gave access to {userToAdd.FullName} at deal {preSaleGroup.Name} ({preSaleGroup.Id})");

                var targetUser = context.PreSaleGroupAccessLists
                    .Include(u => u.User)
                    .Where(d => d.PreSaleGroupId == preSaleGroup.Id && d.UserId == userToAdd.Id).SingleOrDefault();

                if (targetUser != null)
                    if (targetUser.IsAbleToEdit != isAbleToEdit)
                        updateAccess.Add(targetUser);

                if (targetUser == null)
                {
                    await context.PreSaleGroupAccessLists.AddAsync(new PreSaleGroupAccessList
                    { PreSaleGroupId = preSaleGroup.Id, UserId = userToAdd.Id, IsAbleToEdit = isAbleToEdit });
                }
            }

            await context.SaveChangesAsync();

            if (updateAccess.Count > 0)
                return StatusCode(StatusCodes.Status201Created, updateAccess);

            return StatusCode(StatusCodes.Status201Created, "success");
        }

        [HttpPut("EditPreSaleGroup/{id}")]
        public async Task<ActionResult> EditPreSaleGroupAsync([FromRoute] Guid id, [FromBody] PreSaleGroupDto preSaleGroupDto)
        {
            log.Info("Pre-sale group start Edit");
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            if (id != preSaleGroupDto.Id)
                return BadRequest();

            var user = await userManager.GetCurrentUserAsync();

            var hasAccess = await accessManager.HasAccessToEditPreSaleGroupListAsync(user.Id);

            if (!hasAccess)
                return StatusCode(403);

            var preSaleGroup = mapper.Map<PreSaleGroup>(preSaleGroupDto);

            preSaleGroup.ChangedByUserId = user.Id;
            preSaleGroup.ChangedDate = DateTime.Now;

            context.Entry(preSaleGroup).State = EntityState.Modified;

            try
            {
                await context.SaveChangesAsync();

                var editedPreSaleGroup = await context.PreSaleGroups
                    .SingleOrDefaultAsync(psg => psg.Id == preSaleGroup.Id);

                log.Info($"Pre-sale group {preSaleGroup.Name} ({preSaleGroup.Id}) was edited by user: {user.DisplayName} ({user.Id})");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await PreSaleGroupExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpPut("EditPreSaleGroupAccess")]
        public async Task<IActionResult> EditPreSaleGroupAccessAsync([FromBody] JObject accessContract)
        {
            var targetUser = context.PreSaleGroupAccessLists
                .SingleOrDefault(
                    d => d.PreSaleGroupId == (Guid)accessContract.GetValue("preSaleGroupId") 
                         && d.UserId == (Guid)accessContract.GetValue("userId")
                         && d.IsAbleToEdit == (bool)accessContract.GetValue("isAbleToEdit"));

            targetUser.IsAbleToEdit = !targetUser.IsAbleToEdit;

            await context.SaveChangesAsync();

            return StatusCode(StatusCodes.Status201Created, "success");
        }

        [HttpPut("DeletePreSaleGroup/{id}")]
        public async Task<ActionResult> DeletePreSaleGroupAsync([FromRoute] Guid id)
        {
            log.Info("Pre-sale group start Delete");
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleGroups = await context.PreSaleGroups
                .Include(psg => psg.Status)
                .Include(psg => psg.Department)
                .SingleOrDefaultAsync(psg => psg.Id == id);

            if (preSaleGroups == null)
                return NotFound();

            var user = await userManager.GetCurrentUserAsync();

            var hasAccess = await accessManager.HasAccessToEditPreSaleGroupListAsync(user.Id);

            if (!hasAccess)
                return StatusCode(403);

            preSaleGroups.IsVisible = false;
            preSaleGroups.ChangedByUserId = user.Id;
            preSaleGroups.ChangedDate = DateTime.Now;

            await context.SaveChangesAsync();

            log.Info($"Pre-sale groups {preSaleGroups.Name} ({preSaleGroups.Id}) was deleted by user: {user.DisplayName} ({user.Id})");

            return Ok(preSaleGroups);
        }

        [HttpDelete("DeletePreSaleGroupAccess/{preSaleGroupId}/{userId}")]
        public async Task<IActionResult> DeletePreSaleGroupAccessAsync([FromRoute] Guid preSaleGroupId, Guid userId)
        {
            if (!ModelState.IsValid)
            {
                log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var user = await userManager.GetCurrentUserAsync();

            var preSaleGroup = await context.PreSaleGroups
                .SingleOrDefaultAsync(psg => psg.Id == preSaleGroupId);

            var hasAccess = await accessManager.HasAccessToEditPreSaleListAsync(user.Id, preSaleGroupId);

            if (!hasAccess)
                return StatusCode(403);

            var access = await context.PreSaleGroupAccessLists
                .Where(m => m.PreSaleGroupId == preSaleGroupId && m.UserId == userId).ToListAsync();

            if (access.Count == 0)
            {
                return NotFound();
            }

            context.PreSaleGroupAccessLists.RemoveRange(access);
            await context.SaveChangesAsync();

            log.Info($"{user.DisplayName} ({user.Id}) deleted access to {userId} at deal {preSaleGroup.Name} ({preSaleGroupId})");

            return Ok("Deleted");
        }

        [HttpGet]
        public async Task<bool> PreSaleGroupExists(Guid id)
        {
            return await context.PreSaleGroups.AnyAsync(psg => psg.Id == id);
        }
        #endregion
    }
}

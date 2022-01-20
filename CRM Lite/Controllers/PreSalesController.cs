using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using CRM_Lite.Data;
using CRM_Lite.Data.Dtos.PreSale;
using CRM_Lite.Data.Models.PreSale;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vostok.Logging.Abstractions;

namespace CRM_Lite.Controllers
{
    [Produces("application/json")]
    [Route("[controller]")]
    public class PreSalesController : Controller
    {
        private readonly ApplicationContext _context;
        private readonly IMapper _mapper;
        private readonly ILog _log;

        public PreSalesController
        (
            ApplicationContext context,
            IMapper mapper,
            ILog log)
        {
            _context = context;
            _mapper = mapper;
            _log = log;
        }

        public async Task<IActionResult> Index()
        {
            ViewBag.IsTop =  true;
            ViewBag.IsCanRead =  true;
            ViewBag.IsCanEdit =  true;
            
            return View();
        }
        
        [HttpGet("{id:guid}")]
        public async Task<ActionResult> PreSale(Guid id)
        {
            ViewBag.IsTop = true;
            ViewBag.IsMarketing = true;

            ViewBag.IsCanRead =  true;
            ViewBag.IsCanEdit =  true;
            
            return View();
        }
        
        [HttpGet("PreSaleStatuses")]
        public async Task<ActionResult<PreSaleStatusDto[]>> GetPreSaleStatusesAsync(CancellationToken cancellationToken)
        {
            var preSaleStatuses = await _context.PreSaleStatuses
                .ToArrayAsync(cancellationToken);

            return _mapper.Map<PreSaleStatusDto[]>(preSaleStatuses);
        }
        
        [HttpGet("PreSaleResults")]
        public async Task<ActionResult<PreSaleResultDto[]>> GetPreSaleResultsAsync()
        {
            if (!ModelState.IsValid)
            {
                _log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleResults = await _context.PreSaleResults
                .ToArrayAsync();

            return _mapper.Map<PreSaleResultDto[]>(preSaleResults);
        }

        [HttpGet("PreSaleRegions")]
        public async Task<ActionResult<PreSaleRegionDto[]>> GetPreSaleRegionsAsync()
        {
            if (!ModelState.IsValid)
            {
                _log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleRegions = await _context.PreSaleRegions
                .ToArrayAsync();

            return _mapper.Map<PreSaleRegionDto[]>(preSaleRegions);
        }
        
        
        #region Pre-sale group
        [HttpGet("PreSaleGroup/{id}")]
        public async Task<ActionResult<PreSaleGroupDto>> GetPreSaleGroupAsync([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                _log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleGroup = await _context.PreSaleGroups
                .SingleOrDefaultAsync(psg => psg.Id == id);

            if (preSaleGroup == null)
                return NotFound();

            return Ok(_mapper.Map<PreSaleGroupDto>(preSaleGroup));
        }
        
        [HttpGet("ForGroupsTable")]
        public async Task<ActionResult<PreSaleGroupDto[]>> GetForGroupsTableAsync()
        {
            var preSaleGroups = await _context.PreSaleGroups
                .Include(psg => psg.Status)
                .Include(psg => psg.Department)
                .ToArrayAsync();
            return _mapper.Map<PreSaleGroupDto[]>(preSaleGroups);
        }

        [HttpGet("PreSaleGroupStatuses")]
        public async Task<ActionResult<PreSaleGroupStatusDto[]>> GetPreSaleGroupStatusesAsync()
        {
            var preSaleGroupStatuses = await _context.PreSaleGroupStatuses
                .ToArrayAsync();

            return _mapper.Map<PreSaleGroupStatusDto[]>(preSaleGroupStatuses);
        }

        [HttpPost("CreatePreSaleGroup")]
        public async Task<ActionResult> CreatePreSaleGroupAsync([FromBody] PreSaleGroupDto preSaleGroupDto)
        {
            _log.Info("Pre-sale group start Create");

            var preSaleGroup = _mapper.Map<PreSaleGroup>(preSaleGroupDto);
            
            preSaleGroup.CreatedDate = DateTime.UtcNow;
            preSaleGroup.ChangedDate = preSaleGroup.CreatedDate;

            await _context.PreSaleGroups.AddAsync(preSaleGroup);

            await _context.SaveChangesAsync();

            return CreatedAtAction("CreatePreSaleGroup", new { id = preSaleGroup.Id }, preSaleGroup);
        }

        [HttpPut("EditPreSaleGroup/{id}")]
        public async Task<ActionResult> EditPreSaleGroupAsync([FromRoute] Guid id, [FromBody] PreSaleGroupDto preSaleGroupDto)
        {
            _log.Info("Pre-sale group start Edit");

            if (id != preSaleGroupDto.Id)
                return BadRequest();

            var preSaleGroup = _mapper.Map<PreSaleGroup>(preSaleGroupDto);
            
            preSaleGroup.ChangedDate = DateTime.UtcNow;

            _context.Entry(preSaleGroup).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
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

        [HttpDelete("DeletePreSaleGroup/{id}")]
        public async Task<ActionResult> DeletePreSaleGroupAsync([FromRoute] Guid id)
        {
            _log.Info("Pre-sale group start Delete");
            if (!ModelState.IsValid)
            {
                _log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleGroup = await _context.PreSaleGroups
                .Include(psg => psg.Status)
                .Include(psg => psg.Department)
                .SingleOrDefaultAsync(psg => psg.Id == id);

            if (preSaleGroup == null)
                return NotFound();

            _context.PreSaleGroups.Remove(preSaleGroup);
            await _context.SaveChangesAsync();

            return Ok(preSaleGroup);
        }
        
        [HttpGet("PreSaleGroupExists/{id:guid}")]
        public async Task<bool> PreSaleGroupExists(Guid id)
        {
            return await _context.PreSaleGroups.AnyAsync(psg => psg.Id == id);
        }
        #endregion
    }
}

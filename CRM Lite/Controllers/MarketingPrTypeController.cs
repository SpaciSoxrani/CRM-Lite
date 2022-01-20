using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.Data;
using CRM.Data.Dtos.MarketingPrType;
using CRM.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    [ApiController]
    public class MarketingPrTypeController : ControllerBase
    {
        private readonly ApplicationContext applicationContext;
        private readonly IMapper mapper;

        public MarketingPrTypeController(ApplicationContext applicationContext, IMapper mapper)
        {
            this.applicationContext = applicationContext;
            this.mapper = mapper;
        }

        // GET: api/MarketingPrType
        [HttpGet]
        public async Task<ActionResult<MarketingPrTypeDto[]>> GetMarketingPrType()
        {
            var prTypes = await applicationContext.MarketingPRType.ToArrayAsync();

            return mapper.Map<MarketingPrTypeDto[]>(prTypes);
        }

        // GET: api/MarketingPrType/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMarketingPrType([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var prType = await applicationContext.MarketingPRType.SingleOrDefaultAsync(m => m.Id == id);

            if (prType == null)
            {
                return NotFound();
            }

            return Ok(prType);
        }

        // PUT: api/MarketingPrType/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMarketingPrType([FromRoute] Guid id, [FromBody] MarketingPRType prType)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != prType.Id)
            {
                return BadRequest();
            }

            applicationContext.Entry(prType).State = EntityState.Modified;

            try
            {
                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MarketingPrTypeExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/MarketingPrType
        [HttpPost]
        public async Task<IActionResult> PostMarketingPrType([FromBody] MarketingPRType prType)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            applicationContext.MarketingPRType.Add(prType);
            await applicationContext.SaveChangesAsync();

            return CreatedAtAction("GetMarketingPrType", new { id = prType.Id }, prType);
        }

        // DELETE: api/MarketingPrType/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMarketingPrType([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var prType = await applicationContext.MarketingPRType.SingleOrDefaultAsync(m => m.Id == id);
            if (prType == null)
            {
                return NotFound();
            }

            applicationContext.MarketingPRType.Remove(prType);
            await applicationContext.SaveChangesAsync();

            return Ok(prType);
        }

        private bool MarketingPrTypeExists(Guid id)
        {
            return applicationContext.MarketingPRType.Any(e => e.Id == id);
        }
    }
}
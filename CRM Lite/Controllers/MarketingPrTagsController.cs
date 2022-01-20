using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.Data;
using CRM.Data.Dtos.MarketingPrTag;
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
    public class MarketingPrTagsController : ControllerBase
    {
        private readonly ApplicationContext applicationContext;
        private readonly IMapper mapper;

        public MarketingPrTagsController(ApplicationContext applicationContext, IMapper mapper)
        {
            this.applicationContext = applicationContext;
            this.mapper = mapper;
        }

        // GET: api/MarketingPrTags
        [HttpGet]
        public async Task<ActionResult<MarketingPrTagDto[]>> GetMarketingPrTag()
        {
            var prTags = await applicationContext.MarketingPRTag.ToArrayAsync();

            return mapper.Map<MarketingPrTagDto[]>(prTags);
        }

        // GET: api/MarketingPrTags/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMarketingPrTag([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var prTag = await applicationContext.MarketingPRTag.SingleOrDefaultAsync(m => m.Id == id);

            if (prTag == null)
            {
                return NotFound();
            }

            return Ok(prTag);
        }

        // PUT: api/MarketingPrTags/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMarketingPrTag([FromRoute] Guid id, [FromBody] MarketingPRTag prTag)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != prTag.Id)
            {
                return BadRequest();
            }

            applicationContext.Entry(prTag).State = EntityState.Modified;

            try
            {
                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MarketingPrTagExists(id))
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

        // POST: api/MarketingPrTags
        [HttpPost]
        public async Task<IActionResult> PostMarketingPrTag([FromBody] MarketingPRTag prTag)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            applicationContext.MarketingPRTag.Add(prTag);
            await applicationContext.SaveChangesAsync();

            return CreatedAtAction("GetMarketingPrTag", new { id = prTag.Id }, prTag);
        }

        // DELETE: api/MarketingPrTags/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMarketingPrTag([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var prTag = await applicationContext.MarketingPRTag.SingleOrDefaultAsync(m => m.Id == id);
            if (prTag == null)
            {
                return NotFound();
            }

            applicationContext.MarketingPRTag.Remove(prTag);
            await applicationContext.SaveChangesAsync();

            return Ok(prTag);
        }

        private bool MarketingPrTagExists(Guid id)
        {
            return applicationContext.MarketingPRTag.Any(e => e.Id == id);
        }
    }
}
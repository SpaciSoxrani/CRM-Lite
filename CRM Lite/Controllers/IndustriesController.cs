using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.Data;
using CRM.Data.Dtos.Industries;
using CRM.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/Industries")]
    [Authorize]
    public class IndustriesController : Controller
    {
        private readonly ApplicationContext applicationContext;
        private readonly IMapper mapper;

        public IndustriesController(ApplicationContext applicationContext, IMapper mapper)
        {
            this.applicationContext = applicationContext;
            this.mapper = mapper;
        }

        // GET: api/Industries
        [HttpGet]
        public async Task<ActionResult<IndustryDto[]>> GetIndustries()
        {
            var industries = await applicationContext.Industries.ToArrayAsync();

            return Ok(mapper.Map<IndustryDto[]>(industries));
        }

        // GET: api/Industries/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetIndustry([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var industry = await applicationContext.Industries.SingleOrDefaultAsync(m => m.Id == id);

            if (industry == null)
            {
                return NotFound();
            }

            return Ok(industry);
        }

        // PUT: api/Industries/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutIndustry([FromRoute] Guid id, [FromBody] Industry industry)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != industry.Id)
            {
                return BadRequest();
            }

            applicationContext.Entry(industry).State = EntityState.Modified;

            try
            {
                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!IndustryExists(id))
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

        // POST: api/Industries
        [HttpPost]
        public async Task<IActionResult> PostIndustry([FromBody] Industry industry)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            applicationContext.Industries.Add(industry);
            await applicationContext.SaveChangesAsync();

            return CreatedAtAction("GetIndustry", new { id = industry.Id }, industry);
        }

        // DELETE: api/Industries/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIndustry([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var industry = await applicationContext.Industries.SingleOrDefaultAsync(m => m.Id == id);
            if (industry == null)
            {
                return NotFound();
            }

            applicationContext.Industries.Remove(industry);
            await applicationContext.SaveChangesAsync();

            return Ok(industry);
        }

        private bool IndustryExists(Guid id)
        {
            return applicationContext.Industries.Any(e => e.Id == id);
        }
    }
}
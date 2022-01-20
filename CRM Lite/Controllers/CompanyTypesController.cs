using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.Data;
using CRM.Data.Dtos.CompanyType;
using CRM.Data.Models.Marketing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    [ApiController]
    public class CompanyTypesController : ControllerBase
    {
        private readonly ApplicationContext applicationContext;
        private readonly IMapper mapper;

        public CompanyTypesController(ApplicationContext applicationContext, IMapper mapper)
        {
            this.applicationContext = applicationContext;
            this.mapper = mapper;
        }

        // GET: api/CompanyTypes
        [HttpGet]
        public async Task<ActionResult<CompanyTypeDto[]>> GetCompanyTypes()
        {
            var companyTypes = await applicationContext.MarketingCompanyTypes.ToArrayAsync();

            return mapper.Map<CompanyTypeDto[]>(companyTypes);
        }

        // GET: api/CompanyTypes/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompanyType([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var type = await applicationContext.MarketingCompanyTypes.SingleOrDefaultAsync(m => m.Id == id);

            if (type == null)
            {
                return NotFound();
            }

            return Ok(type);
        }

        // PUT: api/CompanyTypes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCompanyType([FromRoute] Guid id, [FromBody] MarketingCompanyType type)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != type.Id)
            {
                return BadRequest();
            }

            applicationContext.Entry(type).State = EntityState.Modified;

            try
            {
                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CompanyTypeExists(id))
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

        // POST: api/CompanyTypes
        [HttpPost]
        public async Task<IActionResult> PostCompanyType([FromBody] MarketingCompanyType type)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            applicationContext.MarketingCompanyTypes.Add(type);
            await applicationContext.SaveChangesAsync();

            return CreatedAtAction("GetCompanyType", new { id = type.Id }, type);
        }

        // DELETE: api/CompanyTypes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompanyType([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var type = await applicationContext.MarketingCompanyTypes.SingleOrDefaultAsync(m => m.Id == id);
            if (type == null)
            {
                return NotFound();
            }

            applicationContext.MarketingCompanyTypes.Remove(type);
            await applicationContext.SaveChangesAsync();

            return Ok(type);
        }

        private bool CompanyTypeExists(Guid id)
        {
            return applicationContext.MarketingCompanyTypes.Any(e => e.Id == id);
        }
    }
}
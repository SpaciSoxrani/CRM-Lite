using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.Data;
using CRM.Data.Dtos.MarketingCompany;
using CRM.Data.Models;
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
    public class MarketingCompanyController : ControllerBase
    {
        private readonly ApplicationContext applicationContext;
        private readonly IMapper mapper;

        public MarketingCompanyController(ApplicationContext applicationContext, IMapper mapper)
        {
            this.applicationContext = applicationContext;
            this.mapper = mapper;
        }

        // GET: api/MarketingCompany
        [HttpGet]
        public async Task<ActionResult<MarketingCompanyShortDto[]>> GetMarketingCompany()
        {
            var companies = await applicationContext.MarketingCompanies.ToArrayAsync();

            return mapper.Map<MarketingCompanyShortDto[]>(companies);
        }

        // GET: api/MarketingCompany/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMarketingCompany([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var company = await applicationContext.MarketingCompanies.SingleOrDefaultAsync(m => m.Id == id);

            if (company == null)
            {
                return NotFound();
            }

            return Ok(company);
        }

        // PUT: api/MarketingCompany/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMarketingCompany([FromRoute] Guid id, [FromBody] MarketingCompany company)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != company.Id)
            {
                return BadRequest();
            }

            applicationContext.Entry(company).State = EntityState.Modified;

            try
            {
                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MarketingCompanyExists(id))
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

        // POST: api/MarketingCompany/PrCompany
        [HttpPost("PrCompany")]
        public async Task<IActionResult> CreatePrCompanyAsync([FromBody] MarketingCompanyWithPrDto companyDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var prCompany = mapper.Map<MarketingPRCompany>(companyDto.PrCompanyDto);
            var marketingCompany = mapper.Map<MarketingCompany>(companyDto);

            marketingCompany.MarketingPRCompany = prCompany;

            await applicationContext.MarketingCompanies.AddAsync(marketingCompany);

            await UpdateProductLinesAsync(companyDto.ProductLineIds, marketingCompany);

            await applicationContext.SaveChangesAsync();

            return CreatedAtAction("CreatePrCompanyAsync", new { id = marketingCompany.Id }, marketingCompany);
        }

        private async Task UpdateProductLinesAsync(Guid[] productLineIds, MarketingCompany company, bool needToClearCompanies = false)
        {
            if (needToClearCompanies)
            {
                var lists = applicationContext.MarketingCompanyProductLines.Where(c => c.MarketingCompanyId == company.Id);

                applicationContext.MarketingCompanyProductLines.RemoveRange(lists);
            }

            var marketingCompanyProductLines = new MarketingCompanyProductLines[productLineIds.Length];

            for (var i = 0; i < productLineIds.Length; i++)
            {
                var productLine = await applicationContext.ProductLines.SingleOrDefaultAsync(l => l.Id == productLineIds[i]);

                marketingCompanyProductLines[i] = new MarketingCompanyProductLines { MarketingCompany = company, ProductLine = productLine };
            }

            await applicationContext.MarketingCompanyProductLines.AddRangeAsync(marketingCompanyProductLines);
        }

        // POST: api/MarketingCompany
        [HttpPost]
        public async Task<IActionResult> PostMarketingCompany([FromBody] MarketingCompany company)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            applicationContext.MarketingCompanies.Add(company);
            await applicationContext.SaveChangesAsync();

            return CreatedAtAction("GetMarketingCompany", new { id = company.Id }, company);
        }

        // DELETE: api/MarketingCompany/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMarketingCompany([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var company = await applicationContext.MarketingCompanies.SingleOrDefaultAsync(m => m.Id == id);
            if (company == null)
            {
                return NotFound();
            }

            applicationContext.MarketingCompanies.Remove(company);
            await applicationContext.SaveChangesAsync();

            return Ok(company);
        }

        private bool MarketingCompanyExists(Guid id)
        {
            return applicationContext.MarketingCompanies.Any(e => e.Id == id);
        }
    }
}
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CRM.Data;
using CRM.Data.Models.Lookup;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/PurchaseTimeIntervals")]
    [Authorize]
    public class PurchaseTimeIntervalsController : Controller
    {
        private readonly ApplicationContext _context;

        public PurchaseTimeIntervalsController(ApplicationContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IEnumerable<PurchaseTimeInterval> GetPurchaseTimeIntervals()
        {
            return _context.PurchaseTimeIntervals;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPurchaseTimeInterval([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var value = await _context.PurchaseTimeIntervals.SingleOrDefaultAsync(m => m.Id == id);

            if (value == null)
            {
                return NotFound();
            }

            return Ok(value);
        }
    }
}
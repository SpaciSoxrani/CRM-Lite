using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CRM.Data;
using CRM.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/BankDetails")]
    [Authorize]
    public class BankDetailsController : Controller
    {
        private readonly ApplicationContext _context;

        public BankDetailsController(ApplicationContext context)
        {
            _context = context;
        }

        // GET: api/BankDetails
        [HttpGet]
        public IEnumerable<BankDetails> GetBankDetails()
        {
            return _context.BankDetails;
        }

        // GET: api/BankDetails/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBankDetails([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var bankDetails = await _context.BankDetails.SingleOrDefaultAsync(m => m.Id == id);

            if (bankDetails == null)
            {
                return NotFound();
            }

            return Ok(bankDetails);
        }

        // PUT: api/BankDetails/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBankDetails([FromRoute] Guid id, [FromBody] BankDetails bankDetails)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != bankDetails.Id)
            {
                return BadRequest();
            }

            _context.Entry(bankDetails).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await BankDetailsExists(id))
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

        // POST: api/BankDetails
        [HttpPost]
        public async Task<IActionResult> PostBankDetails([FromBody] BankDetails bankDetails)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.BankDetails.Add(bankDetails);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetBankDetails", new { id = bankDetails.Id }, bankDetails);
        }

        // DELETE: api/BankDetails/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBankDetails([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var bankDetails = await _context.BankDetails.SingleOrDefaultAsync(m => m.Id == id);
            if (bankDetails == null)
            {
                return NotFound();
            }

            _context.BankDetails.Remove(bankDetails);
            await _context.SaveChangesAsync();

            return Ok(bankDetails);
        }

        private async Task<bool> BankDetailsExists(Guid id)
        {
            return await _context.BankDetails.AnyAsync(e => e.Id == id);
        }
    }
}
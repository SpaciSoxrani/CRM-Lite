using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CRM.Data;
using CRM.Data.Models.Lookup;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/Interests")]
    [Authorize]
    public class InterestsController : Controller
    {
        private readonly ApplicationContext _context;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public InterestsController(ApplicationContext context, IBackgroundJobClient backgroundJobClient)
        {
            _context = context;
            _backgroundJobClient = backgroundJobClient;
        }

        // GET: api/Interests
        [HttpGet]
        public IEnumerable<Interest> GetInterests()
        {
            return _context.Interests;
        }

        // GET: api/Interests/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetInterest([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var interest = await _context.Interests.SingleOrDefaultAsync(m => m.Id == id);

            if (interest == null)
            {
                return NotFound();
            }

            return Ok(interest);
        }

        // PUT: api/Interests/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutInterest([FromRoute] Guid id, [FromBody] Interest interest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != interest.Id)
            {
                return BadRequest();
            }

            _context.Entry(interest).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!InterestExists(id))
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

        // POST: api/Interests
        [HttpPost]
        public async Task<IActionResult> PostInterest([FromBody] Interest interest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Interests.Add(interest);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetInterest", new { id = interest.Id }, interest);
        }

        // DELETE: api/Interests/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInterest([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var interest = await _context.Interests.SingleOrDefaultAsync(m => m.Id == id);
            if (interest == null)
            {
                return NotFound();
            }

            _context.Interests.Remove(interest);
            await _context.SaveChangesAsync();

            return Ok(interest);
        }

        private bool InterestExists(Guid id)
        {
            return _context.Interests.Any(e => e.Id == id);
        }
    }
}

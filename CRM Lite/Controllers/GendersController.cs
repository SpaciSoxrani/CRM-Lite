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
    [Route("api/Genders")]
    [Authorize]
    public class GendersController : Controller
    {
        private readonly ApplicationContext _context;

        public GendersController(ApplicationContext context)
        {
            _context = context;
        }

        // GET: api/Sexes
        [HttpGet]
        public IEnumerable<Gender> GetSex()
        {
            return _context.Genders;
        }

        // GET: api/Sexes/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSex([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var sex = await _context.Genders.SingleOrDefaultAsync(m => m.Id == id);

            if (sex == null)
            {
                return NotFound();
            }

            return Ok(sex);
        }

        // PUT: api/Sexes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSex([FromRoute] Guid id, [FromBody] Gender gender)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != gender.Id)
            {
                return BadRequest();
            }

            _context.Entry(gender).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SexExists(id))
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

        // POST: api/Sexes
        [HttpPost]
        public async Task<IActionResult> PostSex([FromBody] Gender gender)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Genders.Add(gender);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetSex", new { id = gender.Id }, gender);
        }

        // DELETE: api/Sexes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSex([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var sex = await _context.Genders.SingleOrDefaultAsync(m => m.Id == id);
            if (sex == null)
            {
                return NotFound();
            }

            _context.Genders.Remove(sex);
            await _context.SaveChangesAsync();

            return Ok(sex);
        }

        private bool SexExists(Guid id)
        {
            return _context.Genders.Any(e => e.Id == id);
        }
    }
}
using System;
using System.Linq;
using System.Threading.Tasks;
using CRM.Data;
using CRM.Data.Models.Lookup;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/SelectionProcedures")]
    [Authorize]
    public class SelectionProceduresController : Controller
    {
        private readonly ApplicationContext _context;

        public SelectionProceduresController(ApplicationContext context)
        {
            _context = context;
        }

        // GET: api/SelectionProcedures
        [HttpGet]
        public DbSet<SelectionProcedure> GetSelectionProcedures()
        {
            return _context.SelectionProcedures;
        }

        // GET: api/SelectionProcedures/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSelectionProcedure([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var value = await _context.SelectionProcedures.SingleOrDefaultAsync(m => m.Id == id);

            if (value == null)
            {
                return NotFound();
            }

            return Ok(value);
        }

        // PUT: api/SelectionProcedures/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSelectionProcedures([FromRoute] Guid id, 
            [FromBody] SelectionProcedure selectionProcedure)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != selectionProcedure.Id)
            {
                return BadRequest();
            }

            _context.Entry(selectionProcedure).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SelectionProcedureExists(id))
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

        // POST: api/SelectionProcedures
        [HttpPost]
        public async Task<IActionResult> PostSelectionProcedure([FromBody] SelectionProcedure selectionProcedure)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.SelectionProcedures.Add(selectionProcedure);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetSelectionProcedures", new { id = selectionProcedure.Id }, selectionProcedure);
        }

        // DELETE: api/SelectionProcedures/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSelectionProcedure([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var value = await _context.SelectionProcedures.SingleOrDefaultAsync(m => m.Id == id);
            if (value == null)
            {
                return NotFound();
            }

            _context.SelectionProcedures.Remove(value);
            await _context.SaveChangesAsync();

            return Ok(value);
        }

        private bool SelectionProcedureExists(Guid id)
        {
            return _context.SelectionProcedures.Any(e => e.Id == id);
        }
    }
}
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
    [Route("api/Relationships")]
    [Authorize]
    public class RelationshipsController : Controller
    {
        private readonly ApplicationContext context;

        public RelationshipsController(ApplicationContext context)
        {
            this.context = context;
        }

        // GET: api/Relationships
        [HttpGet]
        public IEnumerable<object> GetRelationships()
        {
            return context.Relationships;
        }

        // GET: api/Relationships/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRelationship([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var relationship = await context.Relationships.SingleOrDefaultAsync(m => m.Id == id);

            if (relationship == null)
            {
                return NotFound();
            }

            return Ok(relationship);
        }

        // PUT: api/Relationships/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRelationship([FromRoute] Guid id, [FromBody] Relationship relationship)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != relationship.Id)
            {
                return BadRequest();
            }

            context.Entry(relationship).State = EntityState.Modified;

            try
            {
                await context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RelationshipExists(id))
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

        // POST: api/Relationships
        [HttpPost]
        public async Task<IActionResult> PostRelationship([FromBody] Relationship relationship)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            context.Relationships.Add(relationship);
            await context.SaveChangesAsync();

            return CreatedAtAction("GetRelationship", new { id = relationship.Id }, relationship);
        }

        // DELETE: api/Relationships/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRelationship([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var relationship = await context.Relationships.SingleOrDefaultAsync(m => m.Id == id);
            if (relationship == null)
            {
                return NotFound();
            }

            context.Relationships.Remove(relationship);
            await context.SaveChangesAsync();

            return Ok(relationship);
        }

        private bool RelationshipExists(Guid id)
        {
            return context.Relationships.Any(e => e.Id == id);
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.Data;
using CRM.Data.Dtos.ContactRoles;
using CRM.Data.Models.Lookup;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/ContactRoles")]
    [Authorize]
    public class ContactRolesController : Controller
    {
        private readonly ApplicationContext applicationContext;
        private readonly IMapper mapper;

        public ContactRolesController(ApplicationContext applicationContext, IMapper mapper)
        {
            this.applicationContext = applicationContext;
            this.mapper = mapper;
        }

        // GET: api/ContactRoles
        [HttpGet]
        public async Task<ActionResult<ContactRoleDto[]>> GetContactRoles()
        {
            var contactRoles = await applicationContext.ContactRoles.ToArrayAsync();

            return mapper.Map<ContactRoleDto[]>(contactRoles);
        }

        // GET: api/ContactRoles/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetContactRole([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var role = await applicationContext.ContactRoles.SingleOrDefaultAsync(m => m.Id == id);

            if (role == null)
            {
                return NotFound();
            }

            return Ok(role);
        }

        // PUT: api/ContactRoles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRole([FromRoute] Guid id, [FromBody] ContactRole role)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != role.Id)
            {
                return BadRequest();
            }

            applicationContext.Entry(role).State = EntityState.Modified;

            try
            {
                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ContactRoleExists(id))
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

        // POST: api/ContactRoles
        [HttpPost]
        public async Task<IActionResult> PostRole([FromBody] ContactRole role)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            applicationContext.ContactRoles.Add(role);
            await applicationContext.SaveChangesAsync();

            return CreatedAtAction("GetContactRole", new { id = role.Id }, role);
        }

        // DELETE: api/ContactRoles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContactRole([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var role = await applicationContext.ContactRoles.SingleOrDefaultAsync(m => m.Id == id);
            if (role == null)
            {
                return NotFound();
            }

            applicationContext.ContactRoles.Remove(role);
            await applicationContext.SaveChangesAsync();

            return Ok(role);
        }

        private bool ContactRoleExists(Guid id)
        {
            return applicationContext.ContactRoles.Any(e => e.Id == id);
        }
    }
}

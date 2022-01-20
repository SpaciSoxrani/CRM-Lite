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
    [Route("api/Roles")]
    [Authorize]
    public class RolesController : Controller
    {
        private readonly ApplicationContext _context;

        public RolesController(ApplicationContext context)
        {
            _context = context;
        }

        // GET: api/Roles
        [HttpGet]
        public IEnumerable<Role> GetRoles()
        {
            return _context.Roles;
        }

        // GET: api/Roles/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRole([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var role = await _context.Roles.SingleOrDefaultAsync(m => m.Id == id);

            if (role == null)
            {
                return NotFound();
            }

            return Ok(role);
        }

        [HttpGet("GetUserRoles")]
        public  JsonResult GetUserRoles(Guid id)
        {
            var roles = _context.Roles
                .Include(u => u.UserRoles)
                .Select( r => new
                {
                    RoleId = r.Id,
                    RoleName = r.Name,
                    IsInRole = r.UserRoles.SingleOrDefault(ur => ur.RoleId == r.Id && ur.UserId == id) != null
                });

            return Json(roles);
        }

        [HttpGet("GetUserRolesByLogin")]
        public IEnumerable<Role> GetUserRolesByLogin(string login)
        {
            var roles = _context.UserRoles.AsNoTracking()
                .Include(ur => ur.User)
                .Include(ur => ur.Role)
                .Where(ur => ur.User.Login.ToLower() == login.ToLower())
                .Select(ur => ur.Role);

            return roles;
        }

        // PUT: api/Roles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRole([FromRoute] Guid id, [FromBody] Role role)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != role.Id)
            {
                return BadRequest();
            }

            _context.Entry(role).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RoleExists(id))
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

        // POST: api/Roles
        [HttpPost]
        public async Task<IActionResult> PostRole([FromBody] Role role)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetRole", new { id = role.Id }, role);
        }

        // DELETE: api/Roles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var role = await _context.Roles.SingleOrDefaultAsync(m => m.Id == id);
            if (role == null)
            {
                return NotFound();
            }

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            return Ok(role);
        }

        private bool RoleExists(Guid id)
        {
            return _context.Roles.Any(e => e.Id == id);
        }
    }
}
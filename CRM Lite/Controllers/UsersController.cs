using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using CRM.Data;
using CRM.Data.Dtos.UserSettings;
using CRM.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/Users")]
    [Authorize]
    public class UsersController : Controller
    {
        private readonly ApplicationContext applicationContext;
        private readonly IMapper mapper;
        private IMemoryCache cache;

        public UsersController(ApplicationContext context, IMapper mapper, IMemoryCache cache)
        {
            applicationContext = context;
            this.mapper = mapper;
            this.cache = cache;
        }

        [HttpGet("PeoplesForKanban/{id}")]
        //[Route("~/api/PeoplesForKanban/{id}")]
        public JsonResult PeoplesForKanban([FromRoute] Guid id)
        {
            var peoples = (from b in applicationContext.Users
                           where b.DepartmentId == id
                           select b).ToList();
            return Json(peoples);
        }

        [HttpGet("Department/{id}")]
        public JsonResult UsersFromDepartment([FromRoute] Guid id)
        {
            var users = applicationContext.Users.Where(u => u.DepartmentId == id)
                .Select(u => new
                {
                    u.Id,
                    u.DisplayName
                });

            return Json(users);
        }

        [HttpGet("GetSalesUsers/{userId}")]
        public JsonResult GetSalesUsers([FromRoute] Guid userId)
        {           
            var sales = applicationContext.Deals              
              .Include(x => x.ResponsibleUser)       
              .Include(x => x.DealAccessLists)
              .Include(x => x.DealAdditionalAccessLists)
              .Where(x => x.DealAccessLists.Any(y => y.UserId == userId) ||
                          x.DealAdditionalAccessLists.Any(y => y.UserId == userId))
              .Select(u => new
              {
                  id = u.ResponsibleUser.Id,
                  departmentId = u.ResponsibleUser.DepartmentId,
                  displayName = u.ResponsibleUser.DisplayName
              }).Distinct();

            return Json(sales);
        }
        
        [HttpGet("Marketing")]
        public async Task<ActionResult<UserShortDto[]>> GetMarketingUsers()
        {
            var marketingUsers = await applicationContext.Users
                .Include(u => u.Department)
                .Where(c => EF.Functions.Like(c.Department.Name, "%маркетинг%"))
                .OrderBy(u => !u.IsActive)
                .ProjectTo<UserShortDto>(mapper.ConfigurationProvider)
                .ToArrayAsync();

            return marketingUsers;
        }

        [HttpGet("GetUserByLogin/{login}")]
        //[Route("~/api/GetUserByLogin/{login}")]
        public async Task<IActionResult> GetUserByLoginForAjax([FromRoute] string login)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await applicationContext.Users
                .Where(us => us.IsActive)
                .SingleOrDefaultAsync(m => m.Login.ToLower() == login.ToLower());

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }

        [HttpGet("GetUserByLogin")]
        public async Task<ActionResult<User>> GetUserByLogin(string login)
        {
            var user = await applicationContext.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.Department)
                .AsNoTracking()
                .Where(us => us.IsActive)
                .SingleOrDefaultAsync(m => m.Login.ToLower() == login.ToLower());

            user.Photo = null;

            return Ok(user);
        }

        // GET: api/Users
        [HttpGet]
        public IEnumerable<User> GetUsers()
        {
            return applicationContext.Users;
        }

        [HttpGet("IdsAndNames")]
        public async Task<ActionResult<UserShortDto[]>> GetUsersIdsAndNames()
        {
            if (!cache.TryGetValue("usersShortAll", out User[] orderedUsers))
            {
                var users = await applicationContext.Users
                    .AsNoTracking().ToListAsync();

                orderedUsers = users
                    .OrderBy(u => u.DisplayName)
                    .ToArray();

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromHours(6));

                cache.Set("usersShort", users, cacheEntryOptions);
            }

            return Ok(mapper.Map<UserShortDto[]>(orderedUsers));
        }

        [HttpGet("IdsAndNames/ResponsibleForContactOrOrganization")]
        public async Task<ActionResult<UserShortDto[]>> ResponsibleForContactOrOrganization()
        {
            if (!cache.TryGetValue("usersShortResponsibleForContactOrOrganization", out User[] orderedUsers))
            {
                var users = await applicationContext.Users
                    .Where(u => u.ContactsResponsibleFor.Any() || u.OrganizationsResponsibleFor.Any())
                    .ToListAsync();

                orderedUsers = users
                    .OrderBy(u => u.DisplayName)
                    .ToArray();

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromHours(6));

                cache.Set("usersShortResponsibleForContactOrOrganization", users, cacheEntryOptions);
            }

            return Ok(mapper.Map<UserShortDto[]>(orderedUsers));
        }

        [HttpGet("IdsAndNames/Active")]
        public async Task<ActionResult<UserShortDto[]>> GetActiveUsersIdsAndNames()
        {
            if (!cache.TryGetValue("usersShort", out User[] users))
            {
                users = applicationContext.Users
                    .AsNoTracking()
                    .Where(us => us.IsActive)
                    .AsEnumerable()
                    .OrderBy(u => u.DisplayName)
                    .ToArray();

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromHours(6));

                cache.Set("usersShort", users, cacheEntryOptions);
            }

            return Ok(mapper.Map<UserShortDto[]>(users));
        }

        [HttpGet("GetUser")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await applicationContext.Users.SingleOrDefaultAsync(m => m.Id == id);

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser([FromRoute] Guid id, [FromBody] User user)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != user.Id)
            {
                return BadRequest();
            }

            applicationContext.Entry(user).State = EntityState.Modified;

            try
            {
                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
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

        // POST: api/Users
        [HttpPost]
        public async Task<IActionResult> PostUser([FromBody] User user)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            applicationContext.Users.Add(user);
            await applicationContext.SaveChangesAsync();

            return CreatedAtAction("GetUser", new { id = user.Id }, user);
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await applicationContext.Users.SingleOrDefaultAsync(m => m.Id == id);
            if (user == null)
            {
                return NotFound();
            }

            applicationContext.Users.Remove(user);
            await applicationContext.SaveChangesAsync();

            return Ok(user);
        }

        private bool UserExists(Guid id)
        {
            return applicationContext.Users.Any(e => e.Id == id);
        }
    }
}
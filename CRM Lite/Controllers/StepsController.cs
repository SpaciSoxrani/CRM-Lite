using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CRM.Data;
using CRM.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/Steps")]
    [Authorize]
    public class StepsController : Controller
    {
        private readonly ApplicationContext applicationContext;

        public StepsController(ApplicationContext applicationContext)
        {
            this.applicationContext = applicationContext;
        }

        // GET: api/Steps
        [HttpGet]
        public IEnumerable<Step> GetSteps()
        {
            //TODO(dstarasov): synchronous IO
            return applicationContext.Steps;
        }

        // GET: api/Steps/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Step>> GetStepAsync([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var step = await applicationContext.Steps.SingleOrDefaultAsync(m => m.Id == id);
            if (step == null)
            {
                return NotFound();
            }

            return step;
        }

        // PUT: api/Steps/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutStepAsync([FromRoute] Guid id, [FromBody] Step step)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != step.Id)
            {
                return BadRequest();
            }

            applicationContext.Entry(step).State = EntityState.Modified;

            try
            {
                await applicationContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                //TODO(dstarasov): может вместо получения конфликта на уровне бд изначально проверять что такой шаг уже существует?
                if (!await ExistsAsync(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        // POST: api/Steps
        [HttpPost]
        public async Task<IActionResult> PostStepAsync([FromBody] Step step)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await applicationContext.Steps.AddAsync(step);
            await applicationContext.SaveChangesAsync();

            return CreatedAtAction("GetStepAsync", new {id = step.Id}, step);
        }

        // DELETE: api/Steps/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<Step>> DeleteStepAsync([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var step = await applicationContext.Steps.SingleOrDefaultAsync(m => m.Id == id);
            if (step == null)
            {
                return NotFound();
            }

            applicationContext.Steps.Remove(step);
            await applicationContext.SaveChangesAsync();

            //TODO(dstarasov): вообще при удалении не принято что либо возвращать и обычно возвращается NoContent
            return step;
        }

        [NonAction]
        private Task<bool> ExistsAsync(Guid id)
        {
            return applicationContext.Steps.AnyAsync(e => e.Id == id);
        }
    }
}
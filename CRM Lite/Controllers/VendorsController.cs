using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using CRM.API.Utilities;
using CRM.Data;
using CRM.Data.AuxiliaryModels;
using CRM.Data.Dtos.Vendors;
using CRM.Data.Models;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoreLinq.Extensions;
using Newtonsoft.Json.Linq;

namespace CRM.API.Controllers
{
	[Produces("application/json")]
	[Route("api/Vendors")]
    [Authorize]
    public class VendorsController : Controller
    {
        private readonly ApplicationContext applicationContext;
        private readonly IAccessManager accessManager;
        private readonly IBackgroundJobClient backgroundJob;
        private readonly IMapper mapper;

        public VendorsController(ApplicationContext context, IAccessManager accessManager, IBackgroundJobClient backgroundJob, IMapper mapper)
        {
            applicationContext = context;
            this.accessManager = accessManager;
            this.backgroundJob = backgroundJob;
            this.mapper = mapper;
        }

        [HttpGet]
		[Route("~/api/VendorsForList")]
		public async Task<JsonResult> VendorsForList()
        {
            var users = await applicationContext.Users.ToListAsync();
			
			string responsibleName, lineName;
			var vendorsList = applicationContext.Vendors.ToList();
			var vendors = new List<VendorData>();
			for (var i = 0; i < vendorsList.Count; i++)
			{			
				var responsible = users.SingleOrDefault(r => r.Id == vendorsList[i].ResponsibleUserId);
				responsibleName = responsible == null ? "" : responsible.DisplayName;

				var line = applicationContext.ProductLines.FirstOrDefault(r => r.Id == vendorsList[i].ProductLineId);
				lineName = line == null ? "" : line.Name;

				vendors.Add(new VendorData
				{
					Id = vendorsList[i].VendorGuid,
					Name = vendorsList[i].Name,
					ResponsibleName = responsibleName,
					LineName = lineName
				});
			}

			return Json(vendors);
		}
		// GET: Vendors
		[HttpGet]
		public IEnumerable<Vendor> GetVendors()
		{
			return applicationContext.Vendors;
		}

        [HttpGet("Deal/{dealId}")]
        public async Task<VendorDto[]> GetVendors([FromRoute] Guid dealId)
        {
            var vendors = await applicationContext.Vendors
                .Include(v => v.ProductLine)
                    .ThenInclude(pl => pl.ProductLineDeals)
                .Where(v => v.ProductLine != null && v.ProductLine.ProductLineDeals.Any(pl => pl.DealId == dealId))
                .Distinct().ToArrayAsync();

            return mapper.Map<VendorDto[]>(vendors);
        }

        [HttpGet("{id}")]
		public async Task<IActionResult> GetVendor([FromRoute] Guid id)
		{
			var vendor = await applicationContext.Vendors.SingleOrDefaultAsync(m => m.VendorGuid == id);		

			if (vendor == null)
				return NotFound();
			
			return Ok(vendor);
		}

        [HttpPut("{id}/{userId}")]
        public async Task<IActionResult> PutVendor([FromRoute] Guid id, [FromRoute] Guid userId, [FromBody] Vendor vendor)
		{
			if (!ModelState.IsValid)
				return BadRequest(ModelState);
			

			if (id != vendor.VendorGuid)			
				return BadRequest();
			

			applicationContext.Entry(vendor).State = EntityState.Modified;

			try
			{
				await applicationContext.SaveChangesAsync();

                if(vendor.ResponsibleUserId != null)
                    backgroundJob.Enqueue(() => accessManager.UpdateAccessForUserAsync((Guid)vendor.ResponsibleUserId));
            }
			catch (DbUpdateConcurrencyException)
			{
				if (!VendorExists(id))				
					return NotFound();
				
				else				
					throw;				
			}

			return NoContent();
		}

		[HttpPost]
		public async Task<IActionResult> PostVendor([FromBody] JObject data)
		{
            var vendor = new Vendor
            {
                Name = (string) data.GetValue("name"),
                ResponsibleUserId = (Guid?) data.GetValue("responsibleUserId"),
                ProductLineId = (Guid?) data.GetValue("productLineId")
            };


            applicationContext.Add(vendor);
			await applicationContext.SaveChangesAsync();

			return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = vendor.VendorGuid });
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> DeleteVendor([FromRoute] Guid id)
		{
			var vendor = await applicationContext.Vendors.FirstOrDefaultAsync(m => m.VendorGuid == id);

			applicationContext.Vendors.Remove(vendor);
			await applicationContext.SaveChangesAsync();

			return StatusCode(201, new EntityCreatedResultAuxiliaryModel { Id = vendor.VendorGuid });
		}

		private bool VendorExists(Guid id)
		{
			return applicationContext.Vendors.Any(e => e.VendorGuid == id);
		}

		private class VendorData
		{
			public Guid Id { get; set; }
			public string Name { get; set; }
			public string ResponsibleName { get; set; }
			public string LineName { get; set; }
		}
	}
}
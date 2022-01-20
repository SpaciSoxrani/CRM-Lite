using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using CRM_Lite.Data;
using CRM_Lite.Data.Dtos.PreSale;
using CRM_Lite.Data.Models.PreSale;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Drawing.Chart;
using OfficeOpenXml.Style;
using Vostok.Logging.Abstractions;

namespace CRM_Lite.Controllers
{
    [Produces("application/json")]
    [Route("[controller]")]
    public class PreSalesController : Controller
    {
        private readonly ApplicationContext _context;
        private readonly IMapper _mapper;
        private readonly ILog _log;

        public PreSalesController
        (
            ApplicationContext context,
            IMapper mapper,
            ILog log)
        {
            _context = context;
            _mapper = mapper;
            _log = log;
        }

        public async Task<IActionResult> Index()
        {
            ViewBag.IsTop =  true;
            ViewBag.IsCanRead =  true;
            ViewBag.IsCanEdit =  true;
            
            return View();
        }
        
        [HttpGet("{id:guid}")]
        public async Task<ActionResult> PreSale(Guid id)
        {
            ViewBag.IsTop = true;
            ViewBag.IsMarketing = true;

            ViewBag.IsCanRead =  true;
            ViewBag.IsCanEdit =  true;
            
            return View();
        }
        
        [HttpGet("PreSaleStatuses")]
        public async Task<ActionResult<PreSaleStatusDto[]>> GetPreSaleStatusesAsync(CancellationToken cancellationToken)
        {
            var preSaleStatuses = await _context.PreSaleStatuses
                .ToArrayAsync(cancellationToken);

            return _mapper.Map<PreSaleStatusDto[]>(preSaleStatuses);
        }

        #region Pre-sale

        [HttpGet("GetPreSaleRept/{preSaleGroupId:guid}")]
        public async Task<ActionResult> GetPreSaleReptAsync(Guid preSaleGroupId)
        {
            if (!ModelState.IsValid)
            {
                _log.Error("Invalid Model");
                return BadRequest(ModelState);
            }
            
            var preSaleGroup = await _context.PreSaleGroups
                .SingleOrDefaultAsync(psg => psg.Id == preSaleGroupId);

            if (preSaleGroup == null)
                return NotFound();
            
            var (stream, type, name) = await CreatePreSaleReportAsync(_log, _context, preSaleGroup);
            return File(stream, type, name);
        }

        [HttpGet("AllPreSales")]
        public async Task<ActionResult<PreSaleDto[]>> AllPreSales()
        {
            var preSales = await _context.PreSales
                .Include(ps => ps.ResponsibleUser)
                .Include(ps => ps.Status)
                .ToArrayAsync();

            return _mapper.Map<PreSaleDto[]>(preSales);
        }

        [HttpGet("PreSaleResults")]
        public async Task<ActionResult<PreSaleResultDto[]>> GetPreSaleResultsAsync()
        {
            var preSaleResults = await _context.PreSaleResults
                .ToArrayAsync();

            return _mapper.Map<PreSaleResultDto[]>(preSaleResults);
        }

        [HttpGet("PreSaleRegions")]
        public async Task<ActionResult<PreSaleRegionDto[]>> GetPreSaleRegionsAsync()
        {
            var preSaleRegions = await _context.PreSaleRegions
                .ToArrayAsync();

            return _mapper.Map<PreSaleRegionDto[]>(preSaleRegions);
        }

        [HttpGet("ForPreSalesTable/{id}")]
        public async Task<ActionResult<PreSaleDto[]>> GetForPreSalesTableAsync([FromRoute] Guid id)
        {
            var preSalesInGroup = await _context.PreSales
                .Include(ps => ps.Status)
                .Include(ps => ps.Result)
                .Include(ps => ps.Region)
                .Include(ps => ps.ResponsibleUser)
                .Include(ps => ps.Group)
                .Where(ps => ps.Group.Id == id)
                .ToArrayAsync();

            if (preSalesInGroup == null)
                return NotFound();

            var preSalesInGroupDto = Ok(_mapper.Map<PreSaleDto[]>(preSalesInGroup));

            return preSalesInGroupDto;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PreSaleDto>> GetPreSaleAsync([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var preSale = await _context.PreSales
                .SingleOrDefaultAsync(m => m.Id == id);

            if (preSale == null)
                return NotFound();

            return Ok(_mapper.Map<PreSaleDto>(preSale));
        }

        [HttpPut("EditPreSale/{id}")]
        public async Task<ActionResult> EditPreSaleAsync([FromRoute] Guid id, [FromBody] PreSaleDto preSaleDto)
        {
            if (id != preSaleDto.Id)
                return BadRequest();

            var preSale = _mapper.Map<PreSale>(preSaleDto);

            preSale.ChangedDate = DateTime.UtcNow;

            _context.Entry(preSale).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();

            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await PreSaleExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return Ok(preSale);
        }

        [HttpPost("CreatePreSale")]
        public async Task<ActionResult> CreatePreSaleAsync([FromBody] PreSaleDto preSaleDto)
        {
            var preSale = _mapper.Map<PreSale>(preSaleDto);
            
            preSale.CreatedDate = DateTime.UtcNow;
            preSale.ChangedDate = preSale.CreatedDate;

            await _context.PreSales.AddAsync(preSale);

            await _context.SaveChangesAsync();
            
            return CreatedAtAction("CreatePreSale", new { id = preSale.Id }, preSale);
        }

        [HttpDelete("DeletePreSale/{id}")]
        public async Task<ActionResult> DeletePreSaleAsync([FromRoute] Guid id)
        {
            _log.Info("Pre-sale start Delete");
            if (!ModelState.IsValid)
            {
                _log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSale = await _context.PreSales
                .Include(ps => ps.Status)
                .Include(ps => ps.Result)
                .Include(ps => ps.Region)
                .Include(ps => ps.ResponsibleUser)
                .Include(ps => ps.Group)
                .SingleOrDefaultAsync(psg => psg.Id == id);

            if (preSale == null)
                return NotFound();

            _context.PreSales.Remove(preSale);
            await _context.SaveChangesAsync();

            return Ok(preSale);
        }

        [HttpGet("PreSaleExists")]
        public async Task<bool> PreSaleExists(Guid id)
        {
            return await _context.PreSales.AnyAsync(ps => ps.Id == id);
        }

        private async Task<(MemoryStream stream, string type, string name)> CreatePreSaleReportAsync(
            ILog log,
            ApplicationContext applicationContext,
            PreSaleGroup preSaleGroup)
        {
            var preSales = await applicationContext.PreSales
                .Where(ps => ps.GroupId == preSaleGroup.Id)
                .ToArrayAsync();

            var preSaleResults = await applicationContext.PreSaleResults.ToArrayAsync();
            var preSaleStatuses = await applicationContext.PreSaleStatuses.ToArrayAsync();

            var regionInWork = new HashSet<Guid?>();
            var nowTime = DateTime.Now;

            var preSaleStatusStats = preSaleStatuses
                .ToDictionary(pss => pss.Name, pss => preSales.Count(ps => ps.StatusId == pss.Id));

            var preSaleResultStats = preSaleResults
                .ToDictionary(psr => psr.Name, psr => preSales.Count(ps => ps.ResultId == psr.Id));

            foreach (var ps in preSales)
                regionInWork.Add(ps.RegionId);

            var stream = new MemoryStream();

            using var package = new ExcelPackage(stream);
            var workSheet = package.Workbook.Worksheets.Add("Лист 1");

            workSheet.Cells["A1"].Value = preSaleGroup.Name;
            workSheet.Cells["C2"].Value = "Статус на";
            workSheet.Cells["D2"].Value = $"{nowTime.Day}.{nowTime.Month}.{nowTime.Year}";
            workSheet.Cells["A3"].Value = "Регионов в работе";
            workSheet.Cells["B3"].Value = regionInWork.Count;
            workSheet.Cells["A4"].Value = "Всего отправлено предложений";
            workSheet.Cells["B4"].Value = preSales.Length;
            workSheet.Cells["A5"].Value = "Передано сейлу";
            workSheet.Cells["B5"].Value = preSaleStatusStats["Передано сейлу"];
            workSheet.Cells["A6"].Value = "В работе";
            workSheet.Cells["B6"].Value = preSaleStatusStats["В работе"];
            workSheet.Cells["A7"].Value = "Не интересно";
            workSheet.Cells["B7"].Value = preSaleStatusStats["Не интересно"];

            workSheet.Cells["A9"].Value = "Сейлы:";
            workSheet.Cells["A10"].Value = "В работе";
            workSheet.Cells["B10"].Value = preSaleResultStats["В работе"];
            workSheet.Cells["A11"].Value = "Рассмотрели, но отказали";
            workSheet.Cells["B11"].Value = preSaleResultStats["Рассмотрели, но отказали"];
            workSheet.Cells["A12"].Value = "Договорились на демонстрацию";
            workSheet.Cells["B12"].Value = preSaleResultStats["Договорились на демонстрацию"];
            workSheet.Cells["A13"].Value = "Успешно";
            workSheet.Cells["B13"].Value = preSaleResultStats["Успешно"];

            workSheet.Cells[1, 1, 13, 2].AutoFitColumns();

            workSheet.Column(2).Width = 10.33;
            workSheet.Column(4).Width = 10.33;

            workSheet.Cells["A1:C1"].Merge = true;
            workSheet.Cells["A2:B2"].Merge = true;

            workSheet.Column(2).Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            workSheet.Cells["C2"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
            workSheet.Cells["D2"].Style.Numberformat.Format = "dd.mm.yyyy";
            workSheet.Cells["D2"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            workSheet.Cells["A2:D13"].Style.Font.Size = 10.0f;
            workSheet.Cells["B3:B13"].Style.Font.Bold = true;
            workSheet.Cells["B3:B13"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
            workSheet.Cells["A9"].Style.Font.Italic = true;
            workSheet.Cells["A1"].Style.Font.Size = 12.0f;
            workSheet.Cells["A1"].Style.Font.Bold = true;

            var statusPieChart = workSheet.Drawings.AddChart("statusPieChart", eChartType.Pie) as ExcelPieChart;
            statusPieChart.Title.Text = "Pre-sale";
            statusPieChart.Series.Add(ExcelCellBase.GetAddress(5, 2, 7, 2), ExcelCellBase.GetAddress(5, 1, 7, 1));
            statusPieChart.Legend.Position = eLegendPosition.Bottom;
            statusPieChart.DataLabel.ShowPercent = true;
            statusPieChart.SetSize(400, 400);
            statusPieChart.SetPosition(14, 0, 0, 0);

            var resultPieChart = workSheet.Drawings.AddChart("resultPieChart", eChartType.Pie) as ExcelPieChart;
            resultPieChart.Title.Text = "Сейл";
            resultPieChart.Series.Add(ExcelCellBase.GetAddress(10, 2, 13, 2), ExcelCellBase.GetAddress(10, 1, 13, 1));
            resultPieChart.Legend.Position = eLegendPosition.Bottom;
            resultPieChart.DataLabel.ShowPercent = true;
            resultPieChart.SetSize(400, 400);
            resultPieChart.SetPosition(14, 0, 4, 0);

            var salesFunnel = workSheet.Drawings.AddChart("salesFunnel", eChartType.ColumnClustered);
            salesFunnel.Title.Text = preSaleGroup.Name;
            var values = workSheet.Cells["B4,B10:B13"];
            var xvalues = workSheet.Cells["A4,A10:A13"];
            salesFunnel.Series.Add(values, xvalues);
            salesFunnel.Legend.Remove();
            salesFunnel.SetSize(400, 400);
            salesFunnel.SetPosition(14, 0, 11, 0);

            package.Save();

            stream.Position = 0;
            var name = $"Отчет по Pre-sale-рассылкам на {nowTime.Day}.{nowTime.Month}.{nowTime.Year}.xlsx";

            return (stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", name);
        }
        
        #endregion

        
        #region Pre-sale group
        
        [HttpGet("PreSaleGroup/{id}")]
        public async Task<ActionResult<PreSaleGroupDto>> GetPreSaleGroupAsync([FromRoute] Guid id)
        {
            if (!ModelState.IsValid)
            {
                _log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleGroup = await _context.PreSaleGroups
                .SingleOrDefaultAsync(psg => psg.Id == id);

            if (preSaleGroup == null)
                return NotFound();

            return Ok(_mapper.Map<PreSaleGroupDto>(preSaleGroup));
        }
        
        [HttpGet("ForGroupsTable")]
        public async Task<ActionResult<PreSaleGroupDto[]>> GetForGroupsTableAsync()
        {
            var preSaleGroups = await _context.PreSaleGroups
                .Include(psg => psg.Status)
                .Include(psg => psg.Department)
                .ToArrayAsync();
            return _mapper.Map<PreSaleGroupDto[]>(preSaleGroups);
        }

        [HttpGet("PreSaleGroupStatuses")]
        public async Task<ActionResult<PreSaleGroupStatusDto[]>> GetPreSaleGroupStatusesAsync()
        {
            var preSaleGroupStatuses = await _context.PreSaleGroupStatuses
                .ToArrayAsync();

            return _mapper.Map<PreSaleGroupStatusDto[]>(preSaleGroupStatuses);
        }

        [HttpPost("CreatePreSaleGroup")]
        public async Task<ActionResult> CreatePreSaleGroupAsync([FromBody] PreSaleGroupDto preSaleGroupDto)
        {
            _log.Info("Pre-sale group start Create");

            var preSaleGroup = _mapper.Map<PreSaleGroup>(preSaleGroupDto);
            
            preSaleGroup.CreatedDate = DateTime.UtcNow;
            preSaleGroup.ChangedDate = preSaleGroup.CreatedDate;

            await _context.PreSaleGroups.AddAsync(preSaleGroup);

            await _context.SaveChangesAsync();

            return CreatedAtAction("CreatePreSaleGroup", new { id = preSaleGroup.Id }, preSaleGroup);
        }

        [HttpPut("EditPreSaleGroup/{id}")]
        public async Task<ActionResult> EditPreSaleGroupAsync([FromRoute] Guid id, [FromBody] PreSaleGroupDto preSaleGroupDto)
        {
            _log.Info("Pre-sale group start Edit");

            if (id != preSaleGroupDto.Id)
                return BadRequest();

            var preSaleGroup = _mapper.Map<PreSaleGroup>(preSaleGroupDto);
            
            preSaleGroup.ChangedDate = DateTime.UtcNow;

            _context.Entry(preSaleGroup).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await PreSaleGroupExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpDelete("DeletePreSaleGroup/{id}")]
        public async Task<ActionResult> DeletePreSaleGroupAsync([FromRoute] Guid id)
        {
            _log.Info("Pre-sale group start Delete");
            if (!ModelState.IsValid)
            {
                _log.Error("Invalid Model");
                return BadRequest(ModelState);
            }

            var preSaleGroup = await _context.PreSaleGroups
                .Include(psg => psg.Status)
                .Include(psg => psg.Department)
                .SingleOrDefaultAsync(psg => psg.Id == id);

            if (preSaleGroup == null)
                return NotFound();

            _context.PreSaleGroups.Remove(preSaleGroup);
            await _context.SaveChangesAsync();

            return Ok(preSaleGroup);
        }
        
        [HttpGet("PreSaleGroupExists/{id:guid}")]
        public async Task<bool> PreSaleGroupExists(Guid id)
        {
            return await _context.PreSaleGroups.AnyAsync(psg => psg.Id == id);
        }
        #endregion
    }
}

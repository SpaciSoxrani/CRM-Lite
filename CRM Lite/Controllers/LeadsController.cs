using Microsoft.AspNetCore.Mvc;

namespace CRM_Lite.Controllers
{
    public class LeadsController : Controller
    {
        public async Task<IActionResult> Index()
        {
            ViewBag.IsTop = true;
            ViewBag.IsMarketing = true;

            ViewBag.IsCanRead = true;
            ViewBag.IsCanEdit = true;
            
            return View();
        }
    }
}

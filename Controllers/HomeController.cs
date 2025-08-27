using Microsoft.AspNetCore.Mvc;
using ExcelProcessor.Models;
using ExcelProcessor.Services;
using ExcelProcessor.Helpers;
using System.Diagnostics;

namespace ExcelProcessor.Controllers
{
    [RequireAuth]
    public class HomeController : Controller
    {
        private readonly ExcelService _excelService;
        private readonly ILogger<HomeController> _logger;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public HomeController(ILogger<HomeController> logger, ExcelService excelService, IWebHostEnvironment webHostEnvironment)
        {
            _logger = logger;
            _excelService = excelService;
            _webHostEnvironment = webHostEnvironment;
        }

        public IActionResult Index()
        {
            return View(new ExcelData());
        }

        [HttpPost]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    TempData["Error"] = "Lütfen bir dosya seçin.";
                    return RedirectToAction("Index");
                }

                if (!Path.GetExtension(file.FileName).ToLower().EndsWith(".xlsx") && 
                    !Path.GetExtension(file.FileName).ToLower().EndsWith(".xls"))
                {
                    TempData["Error"] = "Sadece Excel dosyaları (.xlsx, .xls) desteklenir.";
                    return RedirectToAction("Index");
                }

                var worksheets = await _excelService.GetWorksheetsAsync(file);
                
                // Store file in session for later use
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                HttpContext.Session.Set("ExcelFile", memoryStream.ToArray());
                HttpContext.Session.SetString("FileName", file.FileName);

                var model = new ExcelData
                {
                    Worksheets = worksheets
                };

                return View("Index", model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file");
                TempData["Error"] = "Dosya yüklenirken bir hata oluştu: " + ex.Message;
                return RedirectToAction("Index");
            }
        }

        [HttpPost]
        public async Task<IActionResult> GetWorksheetData(string worksheetName)
        {
            try
            {
                var fileBytes = HttpContext.Session.Get("ExcelFile");
                var fileName = HttpContext.Session.GetString("FileName");

                if (fileBytes == null)
                {
                    return Json(new { success = false, message = "Dosya bulunamadı. Lütfen tekrar yükleyin." });
                }

                // Create a temporary IFormFile from session data
                var stream = new MemoryStream(fileBytes);
                var formFile = new FormFile(stream, 0, fileBytes.Length, "file", fileName ?? "excel.xlsx")
                {
                    Headers = new HeaderDictionary(),
                    ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                };

                var worksheetData = await _excelService.GetWorksheetDataAsync(formFile, worksheetName);

                return Json(new { 
                    success = true, 
                    data = worksheetData.Rows,
                    headers = worksheetData.Headers
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting worksheet data");
                return Json(new { success = false, message = "Veri alınırken hata oluştu: " + ex.Message });
            }
        }

        [HttpGet]
        public IActionResult DownloadTemplate()
        {
            try
            {
                var templatePath = Path.Combine(_webHostEnvironment.WebRootPath, "templates", "orjtetkikkk.xlsx");
                
                if (!System.IO.File.Exists(templatePath))
                {
                    return NotFound("Excel şablonu bulunamadı!");
                }

                var fileBytes = System.IO.File.ReadAllBytes(templatePath);
                var fileName = "MEB-Excel-Sablonu.xlsx";
                
                return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                return BadRequest($"Hata: {ex.Message}");
            }
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}

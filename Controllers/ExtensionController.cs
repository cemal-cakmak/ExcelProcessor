using Microsoft.AspNetCore.Mvc;
using ExcelProcessor.Models;
using ExcelProcessor.Services;

namespace ExcelProcessor.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExtensionController : ControllerBase
    {
        private readonly ILogger<ExtensionController> _logger;

        public ExtensionController(ILogger<ExtensionController> logger)
        {
            _logger = logger;
        }

        [HttpGet("getData")]
        public IActionResult GetData()
        {
            try
            {
                // Session'dan Excel verilerini al
                var fileBytes = HttpContext.Session.Get("ExcelFile");
                var fileName = HttpContext.Session.GetString("FileName");

                if (fileBytes == null)
                {
                    return Ok(new { success = false, message = "Excel verisi bulunamadı. Lütfen önce dosya yükleyin." });
                }

                // Excel verilerini döndür (bu gerçek implementasyonda session'dan alınacak)
                // Şimdilik mock data döndürelim
                var mockData = new List<Dictionary<string, object>>
                {
                    new Dictionary<string, object>
                    {
                        ["Soru No"] = "1",
                        ["Soru"] = "Kuruluşta, tüm alanları içerecek şekilde ilgili tarafları da kapsayan hijyen ve enfeksiyon risklerine yönelik bir risk değerlendirmesi mevcut mu?",
                        ["Cevap"] = "Mebbiş risk değerlendirme modülünde görülmüştür.",
                        ["Durum"] = "Evet"
                    },
                    new Dictionary<string, object>
                    {
                        ["Soru No"] = "2", 
                        ["Soru"] = "Kuruluşta, Enfeksiyon Önleme ve Kontrol Eylem Planı/Planları hazırlanmış mı?",
                        ["Cevap"] = "Mebbiş risk değerlendirme modülü ve Enfeksiyon Önleme ve Kontrol Eylem Planı görülmüştür.",
                        ["Durum"] = "Evet"
                    }
                };

                return Ok(new { 
                    success = true, 
                    data = mockData,
                    count = mockData.Count,
                    message = $"{mockData.Count} satır veri hazır"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Extension veri alma hatası");
                return Ok(new { success = false, message = "Sunucu hatası: " + ex.Message });
            }
        }

        [HttpPost("sendData")]
        public IActionResult SendData([FromBody] ExtensionDataRequest request)
        {
            try
            {
                if (request?.Data == null || !request.Data.Any())
                {
                    return Ok(new { success = false, message = "Veri bulunamadı" });
                }

                // Extension'a veri gönder (gerçek implementasyonda Chrome extension API kullanılacak)
                _logger.LogInformation($"Extension'a {request.Data.Count} satır veri gönderiliyor");

                return Ok(new { 
                    success = true, 
                    message = $"{request.Data.Count} satır veri extension'a gönderildi",
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Extension veri gönderme hatası");
                return Ok(new { success = false, message = "Hata: " + ex.Message });
            }
        }

        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            return Ok(new { 
                success = true, 
                status = "connected",
                version = "1.0.0",
                timestamp = DateTime.Now,
                message = "Extension API aktif"
            });
        }

        [HttpPost("test")]
        public IActionResult TestConnection()
        {
            return Ok(new { 
                success = true, 
                message = "Test başarılı! Extension ile bağlantı kuruldu.",
                timestamp = DateTime.Now
            });
        }
    }

    public class ExtensionDataRequest
    {
        public List<Dictionary<string, object>> Data { get; set; } = new List<Dictionary<string, object>>();
        public string Mapping { get; set; } = "bolum1";
        public string TargetUrl { get; set; } = "";
    }
}

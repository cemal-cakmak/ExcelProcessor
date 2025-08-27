using Microsoft.AspNetCore.Mvc;
using ExcelProcessor.Data;
using ExcelProcessor.Helpers;
using ExcelProcessor.Models;
using System.Security.Cryptography;
using System.Text;

namespace ExcelProcessor.Controllers
{
    [RequireAuth]
    public class AdminController : Controller
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        public IActionResult Dashboard()
        {
            // Admin kontrolü
            if (!HttpContext.Session.IsAdmin())
            {
                return RedirectToAction("Index", "Home");
            }

            var users = _context.Users.ToList();
            
            var model = new AdminDashboardViewModel
            {
                TotalUsers = users.Count,
                AdminUsers = users.Count(u => u.IsAdmin),
                RegularUsers = users.Count(u => !u.IsAdmin),
                Users = users
            };

            return View(model);
        }

        public IActionResult Users()
        {
            if (!HttpContext.Session.IsAdmin())
            {
                return RedirectToAction("Index", "Home");
            }

            var users = _context.Users.OrderBy(u => u.Username).ToList();
            return View(users);
        }

        public IActionResult Statistics()
        {
            if (!HttpContext.Session.IsAdmin())
            {
                return RedirectToAction("Index", "Home");
            }

            var stats = new StatisticsViewModel
            {
                TotalUsers = _context.Users.Count(),
                ActiveUsers = _context.Users.Count(u => !u.IsAdmin),
                AdminUsers = _context.Users.Count(u => u.IsAdmin),
                RecentUsers = _context.Users.OrderByDescending(u => u.CreatedDate).Take(5).ToList(),
                UserRegistrationsByMonth = GetUserRegistrationsByMonth()
            };

            return View(stats);
        }

        public IActionResult Logs()
        {
            if (!HttpContext.Session.IsAdmin())
            {
                return RedirectToAction("Index", "Home");
            }

            // Simulated log data for demo
            var logs = new List<LogEntry>
            {
                new LogEntry { Id = 1, Level = "INFO", Message = "Kullanıcı giriş yaptı: admin", Timestamp = DateTime.Now.AddMinutes(-5) },
                new LogEntry { Id = 2, Level = "INFO", Message = "Excel dosyası yüklendi: example.xlsx", Timestamp = DateTime.Now.AddMinutes(-10) },
                new LogEntry { Id = 3, Level = "WARNING", Message = "Geçersiz giriş denemesi", Timestamp = DateTime.Now.AddMinutes(-15) },
                new LogEntry { Id = 4, Level = "INFO", Message = "Script oluşturuldu", Timestamp = DateTime.Now.AddMinutes(-20) },
                new LogEntry { Id = 5, Level = "ERROR", Message = "Dosya yükleme hatası", Timestamp = DateTime.Now.AddMinutes(-25) }
            };

            return View(logs);
        }

        public IActionResult Settings()
        {
            if (!HttpContext.Session.IsAdmin())
            {
                return RedirectToAction("Index", "Home");
            }

            var settings = new SystemSettingsViewModel
            {
                ApplicationName = "Excel İşleyici",
                Version = "1.0.0",
                MaxFileSize = "10 MB",
                AllowedFileTypes = ".xlsx, .xls",
                SessionTimeout = "30 dakika"
            };

            return View(settings);
        }

        [HttpPost]
        public async Task<IActionResult> AddUser([FromBody] AddUserRequest request)
        {
            if (!HttpContext.Session.IsAdmin())
            {
                return Json(new { success = false, message = "Yetkisiz erişim!" });
            }

            try
            {
                // Kullanıcı adı kontrolü
                if (_context.Users.Any(u => u.Username == request.Username))
                {
                    return Json(new { success = false, message = "Bu kullanıcı adı zaten mevcut!" });
                }

                var user = new User
                {
                    Username = request.Username,
                    PasswordHash = HashPassword(request.Password),
                    IsAdmin = request.IsAdmin,
                    CreatedDate = DateTime.Now
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Kullanıcı başarıyla eklendi!", userId = user.Id });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Hata: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest request)
        {
            if (!HttpContext.Session.IsAdmin())
            {
                return Json(new { success = false, message = "Yetkisiz erişim!" });
            }

            try
            {
                var user = await _context.Users.FindAsync(request.Id);
                if (user == null)
                {
                    return Json(new { success = false, message = "Kullanıcı bulunamadı!" });
                }

                // Kullanıcı adı kontrolü (kendisi hariç)
                if (_context.Users.Any(u => u.Username == request.Username && u.Id != request.Id))
                {
                    return Json(new { success = false, message = "Bu kullanıcı adı zaten mevcut!" });
                }

                user.Username = request.Username;
                user.IsAdmin = request.IsAdmin;

                // Şifre değiştirilecekse
                if (!string.IsNullOrEmpty(request.Password))
                {
                    user.PasswordHash = HashPassword(request.Password);
                }

                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Kullanıcı başarıyla güncellendi!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Hata: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteUser([FromBody] DeleteUserRequest request)
        {
            if (!HttpContext.Session.IsAdmin())
            {
                return Json(new { success = false, message = "Yetkisiz erişim!" });
            }

            try
            {
                // Ana admin hesabını silmeyi engelle
                if (request.Id == 1)
                {
                    return Json(new { success = false, message = "Ana admin hesabı silinemez!" });
                }

                var user = await _context.Users.FindAsync(request.Id);
                if (user == null)
                {
                    return Json(new { success = false, message = "Kullanıcı bulunamadı!" });
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Kullanıcı başarıyla silindi!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Hata: {ex.Message}" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUser(int id)
        {
            if (!HttpContext.Session.IsAdmin())
            {
                return Json(new { success = false, message = "Yetkisiz erişim!" });
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return Json(new { success = false, message = "Kullanıcı bulunamadı!" });
            }

            return Json(new
            {
                success = true,
                user = new
                {
                    id = user.Id,
                    username = user.Username,
                    isAdmin = user.IsAdmin,
                    createdDate = user.CreatedDate.ToString("dd.MM.yyyy")
                }
            });
        }

        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
            }
        }

        private Dictionary<string, int> GetUserRegistrationsByMonth()
        {
            var registrations = new Dictionary<string, int>();
            var now = DateTime.Now;
            
            for (int i = 5; i >= 0; i--)
            {
                var month = now.AddMonths(-i);
                var monthName = month.ToString("MMM yyyy");
                var count = _context.Users.Count(u => u.CreatedDate.Month == month.Month && u.CreatedDate.Year == month.Year);
                registrations[monthName] = count;
            }

            return registrations;
        }
    }

    // Request Models
    public class AddUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool IsAdmin { get; set; }
    }

    public class UpdateUserRequest
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Password { get; set; }
        public bool IsAdmin { get; set; }
    }

    public class DeleteUserRequest
    {
        public int Id { get; set; }
    }
}

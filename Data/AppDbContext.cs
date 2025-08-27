using Microsoft.EntityFrameworkCore;
using ExcelProcessor.Models;
using System.Security.Cryptography;
using System.Text;

namespace ExcelProcessor.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Seed data - admin ve user hesapları
            modelBuilder.Entity<User>().HasData(
                new User 
                { 
                    Id = 1, 
                    Username = "admin", 
                    PasswordHash = HashPassword("admin123"), 
                    IsAdmin = true, 
                    CreatedDate = DateTime.Now 
                },
                new User 
                { 
                    Id = 2, 
                    Username = "user", 
                    PasswordHash = HashPassword("user123"), 
                    IsAdmin = false, 
                    CreatedDate = DateTime.Now 
                }
            );
        }

        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
            }
        }
    }
}

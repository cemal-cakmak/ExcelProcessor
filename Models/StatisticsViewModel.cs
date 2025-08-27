namespace ExcelProcessor.Models
{
    public class StatisticsViewModel
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int AdminUsers { get; set; }
        public List<User> RecentUsers { get; set; } = new List<User>();
        public Dictionary<string, int> UserRegistrationsByMonth { get; set; } = new Dictionary<string, int>();
    }
}

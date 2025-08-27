namespace ExcelProcessor.Models
{
    public class AdminDashboardViewModel
    {
        public int TotalUsers { get; set; }
        public int AdminUsers { get; set; }
        public int RegularUsers { get; set; }
        public List<User> Users { get; set; } = new List<User>();
    }
}

namespace ExcelProcessor.Models
{
    public class ExcelData
    {
        public List<string> Worksheets { get; set; } = new List<string>();
        public List<Dictionary<string, object>> Data { get; set; } = new List<Dictionary<string, object>>();
        public List<string> Headers { get; set; } = new List<string>();
        public string SelectedWorksheet { get; set; } = string.Empty;
    }

    public class WorksheetData
    {
        public string Name { get; set; } = string.Empty;
        public List<Dictionary<string, object>> Rows { get; set; } = new List<Dictionary<string, object>>();
        public List<string> Headers { get; set; } = new List<string>();
    }
}

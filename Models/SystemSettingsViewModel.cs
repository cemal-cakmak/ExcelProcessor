namespace ExcelProcessor.Models
{
    public class SystemSettingsViewModel
    {
        public string ApplicationName { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string MaxFileSize { get; set; } = string.Empty;
        public string AllowedFileTypes { get; set; } = string.Empty;
        public string SessionTimeout { get; set; } = string.Empty;
    }
}

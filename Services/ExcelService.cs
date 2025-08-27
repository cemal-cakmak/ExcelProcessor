using OfficeOpenXml;
using ExcelProcessor.Models;

namespace ExcelProcessor.Services
{
    public class ExcelService
    {
        public ExcelService()
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        }

        public async Task<List<string>> GetWorksheetsAsync(IFormFile file)
        {
            var worksheets = new List<string>();
            
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            
            using var package = new ExcelPackage(stream);
            foreach (var worksheet in package.Workbook.Worksheets)
            {
                worksheets.Add(worksheet.Name);
            }
            
            return worksheets;
        }

        public async Task<WorksheetData> GetWorksheetDataAsync(IFormFile file, string worksheetName)
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            
            using var package = new ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets[worksheetName];
            
            if (worksheet == null)
                throw new ArgumentException($"Worksheet '{worksheetName}' not found.");

            var result = new WorksheetData
            {
                Name = worksheetName
            };

            // Get dimensions
            var startRow = worksheet.Dimension?.Start.Row ?? 1;
            var endRow = worksheet.Dimension?.End.Row ?? 1;
            var startCol = worksheet.Dimension?.Start.Column ?? 1;
            var endCol = worksheet.Dimension?.End.Column ?? 1;

            // Get headers from first row
            for (int col = startCol; col <= endCol; col++)
            {
                var headerValue = worksheet.Cells[startRow, col].Value?.ToString() ?? $"Column_{col}";
                result.Headers.Add(headerValue);
            }

            // Get data rows
            for (int row = startRow + 1; row <= endRow; row++)
            {
                var rowData = new Dictionary<string, object>();
                
                for (int col = startCol; col <= endCol; col++)
                {
                    var header = result.Headers[col - startCol];
                    var value = worksheet.Cells[row, col].Value ?? "";
                    rowData[header] = value;
                }
                
                result.Rows.Add(rowData);
            }

            return result;
        }

        public byte[] GenerateBookmarkletData(WorksheetData data, Dictionary<string, string> fieldMapping)
        {
            var bookmarkletData = new
            {
                mapping = fieldMapping,
                data = data.Rows
            };

            return System.Text.Encoding.UTF8.GetBytes(System.Text.Json.JsonSerializer.Serialize(bookmarkletData));
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ExcelProcessor.Helpers
{
    public class RequireAuthAttribute : Attribute, IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            var userId = context.HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
            {
                context.Result = new RedirectToActionResult("Login", "Auth", null);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // Nothing to do here
        }
    }

    public static class SessionExtensions
    {
        public static bool IsLoggedIn(this ISession session)
        {
            return !string.IsNullOrEmpty(session.GetString("UserId"));
        }

        public static bool IsAdmin(this ISession session)
        {
            var isAdmin = session.GetString("IsAdmin");
            return bool.TryParse(isAdmin, out bool result) && result;
        }

        public static string GetUsername(this ISession session)
        {
            return session.GetString("Username") ?? "Kullanıcı";
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Quizlytic.API.Data;

namespace Quizlytic.API.Endpoints
{
    public static class QrCodeEndpoints
    {
        public static void MapQrCodeEndpoints(this IEndpointRouteBuilder routes)
        {
            routes.MapGet("/api/qrcode/{pinCode}", async (string pinCode, QuizlyticDbContext db) =>
            {
                var quiz = await db.Quizzes.FirstOrDefaultAsync(q => q.PinCode == pinCode);
                if (quiz == null) return Results.NotFound();

                var response = new { url = $"https://quizlytic.app/quiz/{quiz.PublicId}" };
                return Results.Ok(response);
            });
        }
    }
}

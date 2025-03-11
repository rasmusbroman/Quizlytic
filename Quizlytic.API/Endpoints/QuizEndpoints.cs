using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Quizlytic.API.Data;
using Quizlytic.API.DTOs;
using Quizlytic.API.Extensions;
using Quizlytic.API.Hubs;
using Quizlytic.API.Models;

namespace Quizlytic.API.Endpoints
{
    public static class QuizEndpoints
    {
        public static void MapQuizEndpoints(this IEndpointRouteBuilder routes)
        {
            var quizEndpoints = routes.MapGroup("/api/quizzes");

            quizEndpoints.MapGet("/", async (HttpContext context, QuizlyticDbContext db) =>
            {
                bool publicOnly = context.Request.Query.ContainsKey("publicOnly") &&
                      context.Request.Query["publicOnly"] == "true";

                var query = db.Quizzes.AsQueryable();
                if (publicOnly)
                {
                    query = query.Where(q => q.IsPublic);
                }

                var quizzes = await query
                    .Include(q => q.Questions)
                    .Include(q => q.Participants)
                    .Select(q => q.ToSummaryDto())
                    .ToListAsync();

                return Results.Ok(quizzes);
            });

            quizEndpoints.MapGet("/{id}", async (int id, QuizlyticDbContext db) =>
            {
                var quiz = await db.Quizzes
                    .Include(q => q.Questions.OrderBy(qst => qst.OrderIndex))
                    .ThenInclude(q => q.Answers)
                    .FirstOrDefaultAsync(q => q.Id == id);

                return quiz == null
                    ? Results.NotFound()
                    : Results.Ok(quiz.ToDetailDto());
            });

            quizEndpoints.MapGet("/public/{publicId}", async (string publicId, QuizlyticDbContext db) =>
            {
                var quiz = await db.Quizzes
                    .Include(q => q.Questions.OrderBy(qst => qst.OrderIndex))
                    .ThenInclude(q => q.Answers)
                    .FirstOrDefaultAsync(q => q.PublicId == publicId);

                return quiz == null
                    ? Results.NotFound()
                    : Results.Ok(quiz.ToDetailDto());
            });

            quizEndpoints.MapPost("/", async (CreateQuizDto quizDto, QuizlyticDbContext db) =>
            {
                var quiz = quizDto.ToEntity();

                quiz.PinCode = GeneratePinCode();
                quiz.PublicId = await GenerateUniquePublicId(db);
                quiz.QrCodeUrl = "";

                quiz.Mode = quizDto.Mode;
                quiz.AllowAnonymous = quizDto.AllowAnonymous;

                db.Quizzes.Add(quiz);
                await db.SaveChangesAsync();

                quiz.QrCodeUrl = $"/api/qrcode/{quiz.PinCode}";
                await db.SaveChangesAsync();
                return Results.Created($"/api/quizzes/{quiz.Id}", quiz.ToDetailDto());
            });

            quizEndpoints.MapPut("/{id}", async (int id, UpdateQuizDto quizDto, QuizlyticDbContext db) =>
            {
                var quiz = await db.Quizzes.FindAsync(id);
                if (quiz == null) return Results.NotFound();

                if (!quiz.CanBeModified())
                    return Results.BadRequest("Cannot modify quiz that has already started");

                quiz.Title = quizDto.Title;
                quiz.Description = quizDto.Description;
                quiz.IsPublic = quizDto.IsPublic;
                quiz.HasCorrectAnswers = quizDto.HasCorrectAnswers;
                quiz.Mode = quizDto.Mode;
                quiz.AllowAnonymous = quizDto.AllowAnonymous;

                await db.SaveChangesAsync();
                return Results.NoContent();
            });

            quizEndpoints.MapDelete("/{id}", async (int id, QuizlyticDbContext db) =>
            {
                var quiz = await db.Quizzes.FindAsync(id);
                if (quiz == null) return Results.NotFound();

                db.Quizzes.Remove(quiz);
                await db.SaveChangesAsync();
                return Results.NoContent();
            });

            quizEndpoints.MapPost("/{id}/start", async (int id, QuizlyticDbContext db, IHubContext<QuizHub> hubContext) =>
            {
                var quiz = await db.Quizzes.FindAsync(id);
                if (quiz == null) return Results.NotFound();

                quiz.Status = QuizStatus.Active;
                quiz.StartedAt = DateTime.UtcNow;

                await db.SaveChangesAsync();
                await hubContext.Clients.Group($"quiz-{id}").SendAsync("QuizStarted");
                return Results.Ok(quiz.ToDetailDto());
            });
        }

        private static string GeneratePinCode()
        {
            Random random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        private static async Task<string> GenerateUniquePublicId(QuizlyticDbContext db)
        {
            bool isUnique = false;
            string publicId = "";

            while (!isUnique)
            {
                publicId = GeneratePublicId();
                isUnique = !(await db.Quizzes.AnyAsync(q => q.PublicId == publicId));
            }
            return publicId;
        }

        private static string GeneratePublicId(int length = 8)
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, length)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}

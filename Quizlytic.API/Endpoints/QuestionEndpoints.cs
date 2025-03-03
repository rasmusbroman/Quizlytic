using Microsoft.EntityFrameworkCore;
using Quizlytic.API.Data;
using Quizlytic.API.DTOs;
using Quizlytic.API.Extensions;

namespace Quizlytic.API.Endpoints
{
    public static class QuestionEndpoints
    {
        public static void MapQuestionEndpoints(this IEndpointRouteBuilder routes)
        {
            var questionEndpoints = routes.MapGroup("/api/questions");

            questionEndpoints.MapPost("/", async (CreateQuestionDto questionDto, QuizlyticDbContext db) =>
            {
                var quiz = await db.Quizzes.FindAsync(questionDto.QuizId);
                if (quiz == null) return Results.NotFound("Quiz not found");

                if (!quiz.CanBeModified())
                    return Results.BadRequest("Cannot modify quiz that has already started");

                var question = questionDto.ToEntity();
                question.OrderIndex = await db.Questions.CountAsync(q => q.QuizId == questionDto.QuizId);

                db.Questions.Add(question);
                await db.SaveChangesAsync();
                return Results.Created($"/api/questions/{question.Id}", question.ToDto());
            });

            questionEndpoints.MapGet("/{id}", async (int id, QuizlyticDbContext db) =>
            {
                var question = await db.Questions
                    .Include(q => q.Answers)
                    .FirstOrDefaultAsync(q => q.Id == id);

                return question == null
                    ? Results.NotFound()
                    : Results.Ok(question.ToDto());
            });

            questionEndpoints.MapGet("/quiz/{quizId}", async (int quizId, QuizlyticDbContext db) =>
            {
                var questions = await db.Questions
                    .Where(q => q.QuizId == quizId)
                    .OrderBy(q => q.OrderIndex)
                    .Include(q => q.Answers)
                    .Select(q => q.ToDto())
                    .ToListAsync();

                return Results.Ok(questions);
            });

            questionEndpoints.MapPut("/{id}", async (int id, UpdateQuestionDto questionDto, QuizlyticDbContext db) =>
            {
                var question = await db.Questions.FindAsync(id);
                if (question == null) return Results.NotFound();

                var quiz = await db.Quizzes.FindAsync(question.QuizId);
                if (quiz == null) return Results.NotFound("Quiz not found");

                if (!quiz.CanBeModified())
                    return Results.BadRequest("Cannot modify quiz that has already started");

                question.Text = questionDto.Text;
                question.ImageUrl = questionDto.ImageUrl;
                question.Type = questionDto.Type;

                await db.SaveChangesAsync();
                return Results.NoContent();
            });

            questionEndpoints.MapDelete("/{id}", async (int id, QuizlyticDbContext db) =>
            {
                var question = await db.Questions.FindAsync(id);
                if (question == null) return Results.NotFound();

                var quiz = await db.Quizzes.FindAsync(question.QuizId);
                if (quiz == null) return Results.NotFound("Quiz not found");

                if (!quiz.CanBeModified())
                    return Results.BadRequest("Cannot modify quiz that has already started");

                db.Questions.Remove(question);
                await db.SaveChangesAsync();
                return Results.NoContent();
            });
        }
    }
}

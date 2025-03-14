using Microsoft.EntityFrameworkCore;
using Quizlytic.API.Data;
using Quizlytic.API.DTOs;
using Quizlytic.API.Models;

namespace Quizlytic.API.Endpoints
{
    public static class SurveyEndpoints
    {
        public static void MapSurveyEndpoints(this IEndpointRouteBuilder routes)
        {
            var surveyEndpoints = routes.MapGroup("/api/surveys");
            surveyEndpoints.MapGet("/{pinCode}/questions", async (string pinCode, QuizlyticDbContext db) =>
            {
                var quiz = await db.Quizzes
                    .FirstOrDefaultAsync(q => q.PinCode == pinCode && q.Mode == QuizMode.SelfPaced);

                if (quiz == null) return Results.NotFound("Survey not found");
                if (quiz.Status == QuizStatus.Completed) return Results.BadRequest("This survey is already completed");
                if (quiz.Status == QuizStatus.Created) return Results.BadRequest("This survey has not started yet");

                var questions = await db.Questions
                    .Where(q => q.QuizId == quiz.Id)
                    .OrderBy(q => q.OrderIndex)
                    .Include(q => q.Answers)
                    .ToListAsync();

                return Results.Ok(new
                {
                    QuizId = quiz.Id,
                    QuizTitle = quiz.Title,
                    QuizDescription = quiz.Description,
                    AllowAnonymous = quiz.AllowAnonymous,
                    Questions = questions.Select(q => new
                    {
                        Id = q.Id,
                        Text = q.Text,
                        ImageUrl = q.ImageUrl,
                        Type = q.Type,
                        Answers = q.Answers.Select(a => new { a.Id, a.Text }).ToList()
                    })
                });
            });

            surveyEndpoints.MapPost("/{pinCode}/responses", async (string pinCode, SurveyResponseDto response, QuizlyticDbContext db) =>
            {
                var quiz = await db.Quizzes
                    .FirstOrDefaultAsync(q => q.PinCode == pinCode && q.Mode == QuizMode.SelfPaced);

                if (quiz == null) return Results.NotFound("Survey not found");
                if (quiz.Status == QuizStatus.Completed) return Results.BadRequest("This survey is already completed");
                if (quiz.Status == QuizStatus.Created) return Results.BadRequest("This survey has not started yet");

                if (string.IsNullOrWhiteSpace(response.ParticipantName) && !quiz.AllowAnonymous)
                {
                    return Results.BadRequest("Name is required for this survey");
                }

                string effectiveName = string.IsNullOrWhiteSpace(response.ParticipantName) ?
                    $"Anonymous-{Guid.NewGuid().ToString().Substring(0, 8)}" : response.ParticipantName;

                var participant = new Participant
                {
                    QuizId = quiz.Id,
                    Name = effectiveName,
                    ConnectionId = null
                };

                db.Participants.Add(participant);
                await db.SaveChangesAsync();

                foreach (var answer in response.Answers)
                {
                    var newResponse = new Response
                    {
                        QuestionId = answer.QuestionId,
                        AnswerId = answer.AnswerId,
                        ParticipantId = participant.Id,
                        FreeTextResponse = answer.FreeTextResponse ?? string.Empty,
                        QuizId = quiz.Id
                    };

                    db.Responses.Add(newResponse);
                }
                await db.SaveChangesAsync();
                return Results.Ok(new { Message = "Responses saved successfully" });
            });
        }
    }
}
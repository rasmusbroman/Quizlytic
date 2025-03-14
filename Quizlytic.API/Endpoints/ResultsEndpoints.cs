using Microsoft.EntityFrameworkCore;
using Quizlytic.API.Data;
using Quizlytic.API.Models;

namespace Quizlytic.API.Endpoints
{
    public static class ResultsEndpoints
    {
        public static void MapResultsEndpoints(this IEndpointRouteBuilder routes)
        {
            var resultsEndpoints = routes.MapGroup("/api/results");
            resultsEndpoints.MapGet("/quiz/{quizId}", async (int quizId, QuizlyticDbContext db) =>
            {
                var quiz = await db.Quizzes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(q => q.Id == quizId);

                if (quiz == null)
                {
                    return Results.NotFound("Quiz not found");
                }

                var questions = await db.Questions
                    .AsNoTracking()
                    .Where(q => q.QuizId == quizId)
                    .OrderBy(q => q.OrderIndex)
                    .Include(q => q.Answers)
                    .ToListAsync();

                var responses = await db.Responses
                    .AsNoTracking()
                    .Where(r => r.QuizId == quizId)
                    .Include(r => r.Participant)
                    .ToListAsync();

                var participants = responses
                    .Select(r => r.Participant)
                    .DistinctBy(p => p.Id)
                    .ToList();

                var questionResults = questions.Select(question =>
                {
                    var questionResponses = responses.Where(r => r.QuestionId == question.Id).ToList();

                    var answerDistribution = new List<object>();
                    if (question.Type != QuestionType.FreeText)
                    {
                        if (question.Type == QuestionType.MultipleChoice)
                        {
                            var answerCounts = new Dictionary<int, int>();

                            foreach (var answer in question.Answers)
                            {
                                int count = questionResponses.Count(r => r.AnswerId == answer.Id);
                                answerCounts[answer.Id] = count;
                            }

                            var uniqueRespondents = questionResponses
                                .Select(r => r.ParticipantId)
                                .Distinct()
                                .Count();

                            answerDistribution = question.Answers.Select(answer =>
                            {
                                var count = answerCounts.ContainsKey(answer.Id) ? answerCounts[answer.Id] : 0;
                                var percentage = uniqueRespondents > 0
                                    ? (double)count / uniqueRespondents * 100
                                    : 0;

                                return new
                                {
                                    AnswerId = answer.Id,
                                    AnswerText = answer.Text,
                                    IsCorrect = answer.IsCorrect,
                                    Count = count,
                                    Percentage = percentage,
                                    IsMultipleChoice = true
                                };
                            }).ToList<object>();
                        }
                        else
                        {
                            var answerGroups = questionResponses
                                .Where(r => r.AnswerId != null)
                                .GroupBy(r => r.AnswerId)
                                .ToDictionary(g => g.Key, g => g.Count());

                            var totalResponses = answerGroups.Values.Sum();

                            answerDistribution = question.Answers.Select(answer =>
                            {
                                var count = answerGroups.ContainsKey(answer.Id) ? answerGroups[answer.Id] : 0;
                                var percentage = totalResponses > 0
                                    ? (double)count / totalResponses * 100
                                    : 0;

                                return new
                                {
                                    AnswerId = answer.Id,
                                    AnswerText = answer.Text,
                                    IsCorrect = answer.IsCorrect,
                                    Count = count,
                                    Percentage = percentage,
                                    IsMultipleChoice = false
                                };
                            }).ToList<object>();
                        }
                    }

                    var freeTextResponses = question.Type == QuestionType.FreeText
                ? questionResponses
                    .Where(r => !string.IsNullOrEmpty(r.FreeTextResponse))
                    .Select(r => new
                    {
                        ParticipantId = r.ParticipantId,
                        ParticipantName = r.Participant.Name,
                        Response = r.FreeTextResponse
                    }).Cast<object>().ToList()
                : new List<object>();

                    var uniqueParticipantCount = questionResponses
                        .Select(r => r.ParticipantId)
                        .Distinct()
                        .Count();

                    return new
                    {
                        QuestionId = question.Id,
                        QuestionText = question.Text,
                        QuestionType = question.Type,
                        ImageUrl = question.ImageUrl,
                        OrderIndex = question.OrderIndex,
                        ResponsesCount = uniqueParticipantCount,
                        TotalSelectionsCount = questionResponses.Count,
                        AnswerDistribution = answerDistribution,
                        FreeTextResponses = freeTextResponses,
                        IsMultipleChoice = question.Type == QuestionType.MultipleChoice
                    };
                }).ToList();

                var result = new
                {
                    QuizId = quiz.Id,
                    QuizTitle = quiz.Title,
                    QuizDescription = quiz.Description,
                    QuizStatus = quiz.Status,
                    QuizMode = quiz.Mode,
                    StartedAt = quiz.StartedAt,
                    EndedAt = quiz.EndedAt,
                    ParticipantsCount = participants.Count,
                    Questions = questionResults,
                    Participants = participants.Select(p => new { p.Id, p.Name }).ToList()
                };
                return Results.Ok(result);
            });
        }
    }
}
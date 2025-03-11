using Quizlytic.API.DTOs;
using Quizlytic.API.Models;

namespace Quizlytic.API.Extensions
{
    public static class MappingExtensions
    {
        public static QuizSummaryDto ToSummaryDto(this Quiz quiz)
        {
            return new QuizSummaryDto(
                quiz.Id,
                quiz.Title,
                quiz.Description,
                quiz.IsPublic,
                quiz.CreatedAt,
                quiz.Status,
                quiz.Questions?.Count ?? 0,
                quiz.Participants?.Count ?? 0,
                quiz.PublicId,
                quiz.Mode,
                quiz.AllowAnonymous
            );
        }

        public static QuizDetailDto ToDetailDto(this Quiz quiz)
        {
            return new QuizDetailDto(
                quiz.Id,
                quiz.Title,
                quiz.Description,
                quiz.IsPublic,
                quiz.CreatedAt,
                quiz.StartedAt,
                quiz.EndedAt,
                quiz.PinCode,
                quiz.QrCodeUrl,
                quiz.Status,
                quiz.HasCorrectAnswers,
                quiz.Questions?.Select(q => q.ToDto()) ?? Enumerable.Empty<QuestionDto>(),
                quiz.PublicId,
                quiz.Mode,
                quiz.AllowAnonymous
            );
        }

        public static QuestionDto ToDto(this Question question)
        {
            return new QuestionDto(
                question.Id,
                question.Text,
                question.ImageUrl,
                question.Type,
                question.QuizId,
                question.OrderIndex,
                question.Answers?.Select(a => a.ToDto()) ?? Enumerable.Empty<AnswerDto>()
            );
        }

        public static AnswerDto ToDto(this Answer answer)
        {
            return new AnswerDto(
                answer.Id,
                answer.Text,
                answer.IsCorrect
            );
        }

        public static Quiz ToEntity(this CreateQuizDto dto)
        {
            return new Quiz
            {
                Title = dto.Title,
                Description = dto.Description,
                IsPublic = dto.IsPublic,
                HasCorrectAnswers = dto.HasCorrectAnswers,
                CreatedAt = DateTime.UtcNow,
                Status = QuizStatus.Created,
                Mode = dto.Mode,
                AllowAnonymous = dto.AllowAnonymous
            };
        }

        public static Question ToEntity(this CreateQuestionDto dto)
        {
            return new Question
            {
                QuizId = dto.QuizId,
                Text = dto.Text,
                ImageUrl = dto.ImageUrl,
                Type = dto.Type
            };
        }
    }
}

using Quizlytic.API.Models;

namespace Quizlytic.API.DTOs
{
    public record CreateQuizDto(string Title, string Description, bool HasCorrectAnswers = true);
    public record UpdateQuizDto(string Title, string Description, bool HasCorrectAnswers);
    //public record CreateQuestionDto(int QuizId, string Text, string ImageUrl, QuestionType Type);
    public record UpdateQuestionDto(string Text, string ImageUrl, QuestionType Type);

    public record QuizSummaryDto(
        int Id,
        string Title,
        string Description,
        DateTime CreatedAt,
        QuizStatus Status,
        int QuestionsCount,
        int ParticipantsCount);

    public record QuizDetailDto(
        int Id,
        string Title,
        string Description,
        DateTime CreatedAt,
        DateTime? StartedAt,
        DateTime? EndedAt,
        string PinCode,
        string QrCodeUrl,
        QuizStatus Status,
        bool HasCorrectAnswers,
        IEnumerable<QuestionDto> Questions);

    public record QuestionDto(
        int Id,
        string Text,
        string ImageUrl,
        QuestionType Type,
        int QuizId,
        int OrderIndex,
        IEnumerable<AnswerDto> Answers);

    public record CreateQuestionDto(
        int QuizId,
        string Text,
        string ImageUrl,
        QuestionType Type,
        IEnumerable<CreateAnswerDto> Answers);

    public record CreateAnswerDto(
        string Text,
        bool IsCorrect);

    public record AnswerDto(
        int Id,
        string Text,
        bool IsCorrect);
}

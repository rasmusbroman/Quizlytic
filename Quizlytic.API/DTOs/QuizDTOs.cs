﻿using Quizlytic.API.Models;

namespace Quizlytic.API.DTOs
{
    public record UpdateQuestionDto(string Text, string ImageUrl, QuestionType Type);
    public record ParticipantDto(int Id, string Name);

    public record CreateQuizDto(
        string Title,
        string Description,
        bool IsPublic = false,
        bool HasCorrectAnswers = true,
        QuizMode Mode = QuizMode.RealTime,
        bool AllowAnonymous = false);

    public record UpdateQuizDto(
        string Title,
        string Description,
        bool IsPublic,
        bool HasCorrectAnswers,
        QuizMode Mode,
        bool AllowAnonymous);

    public record QuizSummaryDto(
        int Id,
        string Title,
        string Description,
        bool IsPublic,
        DateTime CreatedAt,
        QuizStatus Status,
        int QuestionsCount,
        int ParticipantsCount,
        string PublicId,
        QuizMode Mode,
        bool AllowAnonymous);

    public record QuizDetailDto(
        int Id,
        string Title,
        string Description,
        bool IsPublic,
        DateTime CreatedAt,
        DateTime? StartedAt,
        DateTime? EndedAt,
        string PinCode,
        string QrCodeUrl,
        QuizStatus Status,
        bool HasCorrectAnswers,
        IEnumerable<QuestionDto> Questions,
        string PublicId,
        QuizMode Mode,
        bool AllowAnonymous,
        IEnumerable<ParticipantDto> Participants);

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

namespace Quizlytic.API.Models
{
    public class Quiz
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsPublic { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public string PinCode { get; set; }
        public string QrCodeUrl { get; set; }
        public QuizStatus Status { get; set; } = QuizStatus.Created;
        public bool HasCorrectAnswers { get; set; } = true;
        public string PublicId { get; set; }
        public QuizMode Mode { get; set; } = QuizMode.SelfPaced;
        public bool AllowAnonymous { get; set; } = false;
        public List<Question> Questions { get; set; } = new List<Question>();
        public List<Participant> Participants { get; set; } = new List<Participant>();

        public bool CanBeModified() => Status == QuizStatus.Created;
        public bool IsActive() => Status == QuizStatus.Active;
        public int QuestionsCount => Questions?.Count ?? 0;
    }
}

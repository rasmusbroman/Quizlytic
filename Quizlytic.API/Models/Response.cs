namespace Quizlytic.API.Models
{
    public class Response
    {
        public int Id { get; set; }
        public int QuestionId { get; set; }
        public Question Question { get; set; }
        public int? AnswerId { get; set; }
        public Answer Answer { get; set; }
        public int ParticipantId { get; set; }
        public Participant Participant { get; set; }
        public string FreeTextResponse { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }
}

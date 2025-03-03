namespace Quizlytic.API.Models
{
    public class Participant
    {
        public int Id { get; set; }
        public int QuizId { get; set; }
        public Quiz Quiz { get; set; }
        public string Name { get; set; }
        public string ConnectionId { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public List<Response> Responses { get; set; } = new List<Response>();
    }
}

namespace Quizlytic.API.Models
{
    public class Quiz
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<Question> Questions { get; set; }

        public int QuestionsCount { get; set; }

        public bool CanBeModified()
        {
            return !Questions.Any(q => q.HasResponses);
        }
    }
}

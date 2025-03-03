namespace Quizlytic.API.Models
{
    public class Question
    {
        public int Id { get; set; }
        public int QuizId { get; set; }
        public Quiz Quiz { get; set; }
        public string Text { get; set; }
        public string ImageUrl { get; set; }
        public QuestionType Type { get; set; } = QuestionType.SingleChoice;
        public int OrderIndex { get; set; }
        public List<Answer> Answers { get; set; } = new List<Answer>();
        public List<Response> Responses { get; set; } = new List<Response>();
        public bool HasResponses => Responses?.Any() == true;
    }
}

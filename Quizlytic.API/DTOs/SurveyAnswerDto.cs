namespace Quizlytic.API.DTOs
{
    public class SurveyAnswerDto
    {
        public int QuestionId { get; set; }
        public int? AnswerId { get; set; }
        public string FreeTextResponse { get; set; }
    }
}

using Quizlytic.API.Endpoints;

namespace Quizlytic.API.DTOs
{
    public class SurveyResponseDto
    {
        public string ParticipantName { get; set; }
        public List<SurveyAnswerDto> Answers { get; set; }
    }
}

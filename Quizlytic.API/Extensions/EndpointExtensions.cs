using Quizlytic.API.Endpoints;

namespace Quizlytic.API.Extensions
{
    public static class EndpointExtensions
    {
        public static void MapQuizlyticEndpoints(this IEndpointRouteBuilder routes)
        {
            routes.MapQuizEndpoints();
            routes.MapQuestionEndpoints();
            routes.MapQrCodeEndpoints();
            routes.MapSurveyEndpoints();
        }
    }
}

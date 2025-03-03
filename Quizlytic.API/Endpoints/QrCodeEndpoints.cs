namespace Quizlytic.API.Endpoints
{
    public static class QrCodeEndpoints
    {
        public static void MapQrCodeEndpoints(this IEndpointRouteBuilder routes)
        {
            routes.MapGet("/api/qrcode/{pinCode}", (string pinCode) =>
            {
                var response = new { url = $"https://quizlytic.app/join/{pinCode}" };
                return Results.Ok(response);
            });
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Quizlytic.API.Data;

namespace Quizlytic.API.Endpoints
{
    public static class ParticipantEndpoints
    {
        public static void MapParticipantEndpoints(this IEndpointRouteBuilder routes)
        {
            var participantEndpoints = routes.MapGroup("/api/participants");
            participantEndpoints.MapGet("/active/{quizId}", async (int quizId, QuizlyticDbContext db) =>
            {
                Console.WriteLine($"REST API: Fetching active participants for quiz {quizId}");

                var rawParticipants = await db.Participants
                    .FromSqlRaw("SELECT * FROM \"Participants\" WHERE \"QuizId\" = {0}", quizId)
                    .ToListAsync();

                Console.WriteLine($"SQL query found {rawParticipants.Count} total participants");
                Console.WriteLine($"Participants with strictly NULL ConnectionId: {rawParticipants.Count(p => p.ConnectionId == null)}");
                Console.WriteLine($"Participants with empty ConnectionId: {rawParticipants.Count(p => p.ConnectionId == "")}");

                var activeParticipants = await db.Participants
                    .Where(p => p.QuizId == quizId && p.ConnectionId != null)
                    .Select(p => new { id = p.Id, name = p.Name })
                    .ToListAsync();

                Console.WriteLine($"REST API: Returning {activeParticipants.Count} active participants");
                return Results.Ok(activeParticipants);
            });

            participantEndpoints.MapPost("/heartbeat", async (HttpContext context, QuizlyticDbContext db) =>
            {
                string connectionId = context.Request.Headers["X-ConnectionId"];
                if (string.IsNullOrEmpty(connectionId))
                    return Results.BadRequest("No connection ID provided");

                var participant = await db.Participants
                    .FirstOrDefaultAsync(p => p.ConnectionId == connectionId);

                if (participant == null)
                    return Results.NotFound("Participant not found");

                return Results.Ok(new { isActive = true });
            });
        }
    }
}

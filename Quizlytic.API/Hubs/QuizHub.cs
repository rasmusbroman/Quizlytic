using Microsoft.AspNetCore.SignalR;

namespace Quizlytic.API.Hubs
{
    public class QuizHub : Hub
    {
        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }
}

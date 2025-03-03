using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Quizlytic.API.Data;
using Quizlytic.API.Models;

namespace Quizlytic.API.Hubs
{
    public class QuizHub : Hub
    {
        private readonly QuizlyticDbContext _context;

        public QuizHub(QuizlyticDbContext context)
        {
            _context = context;
        }
        public async Task JoinAsHost(string quizId)
        {
            string groupName = $"quiz-{quizId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Groups.AddToGroupAsync(Context.ConnectionId, $"{groupName}-host");
            //await Clients.Group(groupName).SendAsync("HostJoined");
        }

        public async Task JoinAsParticipant(string pinCode, string participantName)
        {
            var quiz = await _context.Quizzes.FirstOrDefaultAsync(q => q.PinCode == pinCode && q.Status == QuizStatus.Active);

            if (quiz == null)
            {
                await Clients.Caller.SendAsync("JoinError", "Quiz not found or not active");
                return;
            }

            var participant = new Participant
            {
                QuizId = quiz.Id,
                Name = participantName,
                ConnectionId = Context.ConnectionId
            };

            _context.Participants.Add(participant);
            await _context.SaveChangesAsync();

            string groupName = $"quiz-{quiz.Id}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            await Clients.Group(groupName).SendAsync("ParticipantJoined", participant.Id, participant.Name);

            await Clients.Caller.SendAsync("QuizInfo", quiz.Title);
        }

        public async Task SubmitAnswer(int questionId, int? answerId, string freeTextAnswer)
        {
            var question = await _context.Questions.FindAsync(questionId);
            if (question == null) return;

            var participant = await _context.Participants.FirstOrDefaultAsync(p => p.ConnectionId == Context.ConnectionId);
            if (participant == null) return;

            var response = new Response
            {
                QuestionId = questionId,
                AnswerId = answerId,
                ParticipantId = participant.Id,
                FreeTextResponse = freeTextAnswer
            };

            _context.Responses.Add(response);
            await _context.SaveChangesAsync();

            string groupName = $"quiz-{question.QuizId}";

            await Clients.Group($"{groupName}-host").SendAsync("NewResponse", questionId, participant.Id);
        }

        public async Task StartQuestion(int quizId, int questionId)
        {
            string groupName = $"quiz-{quizId}";
            var question = await _context.Questions
                .Include(q => q.Answers)
                .FirstOrDefaultAsync(q => q.Id == questionId);

            if (question == null) return;

            await Clients.Group(groupName).SendAsync("QuestionStarted", question.Id, question.Text, question.ImageUrl, question.Type,
                question.Answers.Select(a => new { a.Id, a.Text }).ToList());
        }

        public async Task EndQuestion(int quizId, int questionId)
        {
            string groupName = $"quiz-{quizId}";

            var results = await _context.Responses
                .Where(r => r.QuestionId == questionId)
                .GroupBy(r => r.AnswerId)
                .Select(g => new { AnswerId = g.Key, Count = g.Count() })
                .ToListAsync();

            await Clients.Group(groupName).SendAsync("QuestionEnded", questionId, results);
        }

        public async Task EndQuiz(int quizId)
        {
            var quiz = await _context.Quizzes.FindAsync(quizId);
            if (quiz == null) return;

            quiz.Status = QuizStatus.Completed;
            quiz.EndedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            string groupName = $"quiz-{quizId}";
            await Clients.Group(groupName).SendAsync("QuizEnded");
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var participant = await _context.Participants.FirstOrDefaultAsync(p => p.ConnectionId == Context.ConnectionId);
            if (participant != null)
            {
                string groupName = $"quiz-{participant.QuizId}";
                await Clients.Group(groupName).SendAsync("ParticipantLeft", participant.Id, participant.Name);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}

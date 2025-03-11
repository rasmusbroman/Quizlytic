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
        }

        public async Task JoinAsParticipant(string pinCode, string participantName)
        {
            var quiz = await _context.Quizzes.FirstOrDefaultAsync(q => q.PinCode == pinCode);

            if (quiz == null)
            {
                await Clients.Caller.SendAsync("JoinError", "Quiz not found");
                return;
            }

            if (quiz.Mode == QuizMode.RealTime && quiz.Status != QuizStatus.Active)
            {
                await Clients.Caller.SendAsync("JoinError", "This quiz is not currently active");
                return;
            }

            if (quiz.Mode == QuizMode.SelfPaced &&
                (quiz.Status == QuizStatus.Completed || quiz.Status == QuizStatus.Created))
            {
                await Clients.Caller.SendAsync("JoinError", "This survey is not currently available");
                return;
            }

            if (string.IsNullOrWhiteSpace(participantName) && !quiz.AllowAnonymous)
            {
                await Clients.Caller.SendAsync("JoinError", "Name is required for this quiz");
                return;
            }

            string effectiveName = string.IsNullOrWhiteSpace(participantName) ?
                "Anonymous" : participantName;

            var participant = new Participant
            {
                QuizId = quiz.Id,
                Name = effectiveName,
                ConnectionId = Context.ConnectionId
            };

            _context.Participants.Add(participant);
            await _context.SaveChangesAsync();

            string groupName = $"quiz-{quiz.Id}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.Group(groupName).SendAsync("ParticipantJoined", participant.Id, participant.Name);
            await Clients.Caller.SendAsync("QuizInfo", quiz.Title, quiz.Mode.ToString());

            if (quiz.Mode == QuizMode.SelfPaced)
            {
                var questions = await _context.Questions
                    .Where(q => q.QuizId == quiz.Id)
                    .OrderBy(q => q.OrderIndex)
                    .Include(q => q.Answers)
                    .ToListAsync();

                await Clients.Caller.SendAsync("SurveyQuestions",
                    questions.Select(q => new {
                        Id = q.Id,
                        Text = q.Text,
                        ImageUrl = q.ImageUrl,
                        Type = q.Type,
                        Answers = q.Answers.Select(a => new { a.Id, a.Text }).ToList()
                    }).ToList());
            }
        }

        public async Task SubmitAnswer(int questionId, int? answerId, string freeTextAnswer)
        {
            var question = await _context.Questions.FindAsync(questionId);
            if (question == null) return;

            var participant = await _context.Participants.FirstOrDefaultAsync(p => p.ConnectionId == Context.ConnectionId);
            if (participant == null) return;

            var quiz = await _context.Quizzes.FindAsync(question.QuizId);
            if (quiz == null) return;

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

            if (quiz.Mode == QuizMode.RealTime)
            {
                await Clients.Group($"{groupName}-host").SendAsync("NewResponse", questionId, participant.Id);
            }

            if (quiz.Mode == QuizMode.SelfPaced)
            {
                await Clients.Caller.SendAsync("ResponseSaved", questionId);
            }
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
                participant.ConnectionId = null;
                await _context.SaveChangesAsync();
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}

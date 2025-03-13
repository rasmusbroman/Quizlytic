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

            var connectedParticipants = await _context.Participants
                .Where(p => p.QuizId == int.Parse(quizId) && p.ConnectionId != null)
                .ToListAsync();

            if (connectedParticipants.Any())
            {
                foreach (var participant in connectedParticipants)
                {
                    await Clients.Caller.SendAsync("ParticipantJoined", participant.Id, participant.Name);
                }
            }
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

            Participant participant;
            var existingParticipant = await _context.Participants
                .FirstOrDefaultAsync(p =>
                    p.QuizId == quiz.Id &&
                    p.Name == effectiveName &&
                    p.ConnectionId == null);

            if (existingParticipant != null)
            {
                Console.WriteLine($"Participant {effectiveName} is reconnecting");
                existingParticipant.ConnectionId = Context.ConnectionId;
                participant = existingParticipant;
            }
            else
            {
                participant = new Participant
                {
                    QuizId = quiz.Id,
                    Name = effectiveName,
                    ConnectionId = Context.ConnectionId
                };
                _context.Participants.Add(participant);
            }
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
                    questions.Select(q => new
                    {
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
            try
            {
                Console.WriteLine($"SubmitAnswer called with questionId: {questionId}, answerId: {answerId}, freeTextResponse: {(freeTextAnswer != null ? "not null" : "null")}, ConnectionId: {Context.ConnectionId}");

                var question = await _context.Questions.FindAsync(questionId);
                if (question == null)
                {
                    Console.WriteLine($"Question with ID {questionId} not found");
                    await Clients.Caller.SendAsync("SubmitError", "Question not found");
                    return;
                }

                var participant = await _context.Participants
                    .FirstOrDefaultAsync(p => p.ConnectionId == Context.ConnectionId);

                if (participant == null)
                {
                    Console.WriteLine($"Participant with ConnectionId {Context.ConnectionId} not found");
                    await Clients.Caller.SendAsync("SubmitError", "Participant not found. You may need to rejoin the quiz.");
                    return;
                }

                var quiz = await _context.Quizzes.FindAsync(question.QuizId);
                if (quiz == null)
                {
                    Console.WriteLine($"Quiz with ID {question.QuizId} not found");
                    await Clients.Caller.SendAsync("SubmitError", "Quiz not found");
                    return;
                }

                var existingResponse = await _context.Responses
                    .FirstOrDefaultAsync(r => r.QuestionId == questionId && r.ParticipantId == participant.Id);

                string safeTextResponse = freeTextAnswer ?? string.Empty;

                if (existingResponse != null)
                {
                    existingResponse.AnswerId = answerId;
                    existingResponse.FreeTextResponse = safeTextResponse;
                    _context.Responses.Update(existingResponse);
                }
                else
                {
                    var response = new Response
                    {
                        QuestionId = questionId,
                        AnswerId = answerId,
                        ParticipantId = participant.Id,
                        FreeTextResponse = safeTextResponse,
                        SubmittedAt = DateTime.UtcNow
                    };
                    _context.Responses.Add(response);
                }

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
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SubmitAnswer: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                await Clients.Caller.SendAsync("SubmitError", "Error saving your answer. Please try again.");
                throw;
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

        public async Task GetActiveParticipants(int quizId)
        {
            try
            {
                var activeParticipants = await _context.Participants
                    .Where(p => p.QuizId == quizId)
                    .ToListAsync();

                var connectedParticipants = activeParticipants
                    .Where(p => p.ConnectionId != null)
                    .Select(p => new { p.Id, p.Name })
                    .ToList();

                Console.WriteLine($"SignalR GetActiveParticipants: Total {activeParticipants.Count}, Connected {connectedParticipants.Count}");

                await Clients.Caller.SendAsync("ActiveParticipantsList", connectedParticipants);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetActiveParticipants: {ex.Message}");
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var participant = await _context.Participants
                .FirstOrDefaultAsync(p => p.ConnectionId == Context.ConnectionId);

            if (participant != null)
            {
                Console.WriteLine($"Participant disconnected: {participant.Id} - {participant.Name}");
                string groupName = $"quiz-{participant.QuizId}";

                participant.ConnectionId = null;

                await _context.SaveChangesAsync();
                await Clients.Group(groupName).SendAsync("ParticipantLeft", participant.Id, participant.Name);
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}

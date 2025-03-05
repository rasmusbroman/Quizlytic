using Microsoft.EntityFrameworkCore;
using Quizlytic.API.Models;

namespace Quizlytic.API.Data
{
    public class QuizlyticDbContext : DbContext
    {
        public QuizlyticDbContext(DbContextOptions<QuizlyticDbContext> options) : base(options)
        {
        }
        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Answer> Answers { get; set; }
        public DbSet<Participant> Participants { get; set; }
        public DbSet<Response> Responses { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Quiz>()
            .HasMany(q => q.Questions)
            .WithOne(q => q.Quiz)
            .HasForeignKey(q => q.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Quiz>()
                .HasMany(q => q.Participants)
                .WithOne(p => p.Quiz)
                .HasForeignKey(p => p.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Question>()
                .HasMany(q => q.Answers)
                .WithOne(a => a.Question)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Question>()
                .HasMany(q => q.Responses)
                .WithOne(r => r.Question)
                .HasForeignKey(r => r.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Answer>()
                .HasOne(a => a.Question)
                .WithMany(q => q.Answers);

            modelBuilder.Entity<Participant>()
                .HasMany(p => p.Responses)
                .WithOne(r => r.Participant)
                .HasForeignKey(r => r.ParticipantId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Quiz>()
                .Property(q => q.Title)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder.Entity<Quiz>()
                .Property(q => q.PinCode)
                .HasMaxLength(6);
        }
    }
}

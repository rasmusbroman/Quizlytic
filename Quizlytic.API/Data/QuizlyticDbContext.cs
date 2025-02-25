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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(QuizlyticDbContext).Assembly);
        }
    }
}

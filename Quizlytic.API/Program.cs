
using Microsoft.EntityFrameworkCore;
using Quizlytic.API.Data;
using Quizlytic.API.Models;
using Quizlytic.API.Hubs;

namespace Quizlytic.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddAuthorization();

            //TEMP
            builder.Services.AddEndpointsApiExplorer();


            builder.Services.AddOpenApi();

            builder.Services.AddSwaggerGen();
            builder.Services.AddDbContext<QuizlyticDbContext>(options =>
            {
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
            });                                         

            builder.Services.AddSignalR();

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();

            //TEMP
            app.MapGet("/", () => "Test backend API");
            //.WithName("GetRoot")
            //.WithOpenApi();

            app.MapHub<QuizHub>("/quizHub");

            app.Run();
        }
    }
}

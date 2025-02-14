
using Microsoft.EntityFrameworkCore;
using Quizlytic.API.Data;
using Quizlytic.API.Models;

namespace Quizlytic.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddAuthorization();

            //TEMP
            builder.Services.AddEndpointsApiExplorer();


            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddOpenApi();

            builder.Services.AddSwaggerGen();
            builder.Services.AddDbContext<QuizlyticDbContext>(options =>
            {
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
            });                                         

            builder.Services.AddSignalR();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
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

            //app.MapHub<QuizlyticHub>("/quizlyticHub");

            app.Run();
        }
    }
}

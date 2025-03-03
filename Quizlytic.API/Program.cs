
using Microsoft.EntityFrameworkCore;
using Quizlytic.API.Data;
using Quizlytic.API.Models;
using Quizlytic.API.Hubs;
using Quizlytic.API.Extensions;

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

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy
                        .WithOrigins("http://localhost:3000")
                        //.AllowAnyOrigin()
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
                        .SetIsOriginAllowed(_ => true)
                        .AllowCredentials();
                });
            });

            builder.Services.AddSignalR();

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors("AllowAll");            
            app.UseRouting();
            app.UseHttpsRedirection();
            app.UseAuthorization();

            //TEMP
            app.MapGet("/", () => "Test backend API");
            //.WithName("GetRoot")
            //.WithOpenApi();

            app.MapQuizlyticEndpoints();
            app.MapHub<QuizHub>("/quizHub");

            app.Run();
        }
    }
}

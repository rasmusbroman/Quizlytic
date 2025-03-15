using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quizlytic.API.Migrations
{
    /// <inheritdoc />
    public partial class AddQuizResponseDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Responses_Quizzes_QuizId",
                table: "Responses");

            migrationBuilder.AddForeignKey(
                name: "FK_Responses_Quizzes_QuizId",
                table: "Responses",
                column: "QuizId",
                principalTable: "Quizzes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Responses_Quizzes_QuizId",
                table: "Responses");

            migrationBuilder.AddForeignKey(
                name: "FK_Responses_Quizzes_QuizId",
                table: "Responses",
                column: "QuizId",
                principalTable: "Quizzes",
                principalColumn: "Id");
        }
    }
}

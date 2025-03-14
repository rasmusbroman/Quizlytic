using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quizlytic.API.Migrations
{
    /// <inheritdoc />
    public partial class QuizResponseId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "FreeTextResponse",
                table: "Responses",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "QuizId",
                table: "Responses",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Responses_QuizId",
                table: "Responses",
                column: "QuizId");

            migrationBuilder.AddForeignKey(
                name: "FK_Responses_Quizzes_QuizId",
                table: "Responses",
                column: "QuizId",
                principalTable: "Quizzes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Responses_Quizzes_QuizId",
                table: "Responses");

            migrationBuilder.DropIndex(
                name: "IX_Responses_QuizId",
                table: "Responses");

            migrationBuilder.DropColumn(
                name: "QuizId",
                table: "Responses");

            migrationBuilder.AlterColumn<string>(
                name: "FreeTextResponse",
                table: "Responses",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}

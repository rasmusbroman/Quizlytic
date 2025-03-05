using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quizlytic.API.Migrations
{
    /// <inheritdoc />
    public partial class AddedHasCorrectAnswers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasCorrectAnswers",
                table: "Quizzes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasCorrectAnswers",
                table: "Quizzes");
        }
    }
}

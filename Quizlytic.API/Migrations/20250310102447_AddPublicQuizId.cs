using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quizlytic.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicQuizId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicId",
                table: "Quizzes",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Quizzes");
        }
    }
}

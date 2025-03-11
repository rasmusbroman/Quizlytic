using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quizlytic.API.Migrations
{
    /// <inheritdoc />
    public partial class ChangedPublicQuizId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "PublicId",
                table: "Quizzes",
                type: "character varying(12)",
                maxLength: 12,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_PublicId",
                table: "Quizzes",
                column: "PublicId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Quizzes_PublicId",
                table: "Quizzes");

            migrationBuilder.AlterColumn<string>(
                name: "PublicId",
                table: "Quizzes",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(12)",
                oldMaxLength: 12);
        }
    }
}

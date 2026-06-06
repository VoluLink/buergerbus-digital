using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddAngelegtVonUserToFahrten : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AngelegtVon",
                table: "Fahrten");

            migrationBuilder.AddColumn<int>(
                name: "AngelegtVonUserId",
                table: "Fahrten",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Fahrten_AngelegtVonUserId",
                table: "Fahrten",
                column: "AngelegtVonUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Fahrten_Benutzer_AngelegtVonUserId",
                table: "Fahrten",
                column: "AngelegtVonUserId",
                principalTable: "Benutzer",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Fahrten_Benutzer_AngelegtVonUserId",
                table: "Fahrten");

            migrationBuilder.DropIndex(
                name: "IX_Fahrten_AngelegtVonUserId",
                table: "Fahrten");

            migrationBuilder.DropColumn(
                name: "AngelegtVonUserId",
                table: "Fahrten");

            migrationBuilder.AddColumn<string>(
                name: "AngelegtVon",
                table: "Fahrten",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }
    }
}

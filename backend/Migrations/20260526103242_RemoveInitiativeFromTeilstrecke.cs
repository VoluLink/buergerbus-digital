using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    /// <inheritdoc />
    public partial class RemoveInitiativeFromTeilstrecke : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Teilstrecken_Initiativen_InitiativeId",
                table: "Teilstrecken");

            migrationBuilder.DropIndex(
                name: "IX_Teilstrecken_InitiativeId",
                table: "Teilstrecken");

            migrationBuilder.DropColumn(
                name: "InitiativeId",
                table: "Teilstrecken");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InitiativeId",
                table: "Teilstrecken",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Teilstrecken_InitiativeId",
                table: "Teilstrecken",
                column: "InitiativeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Teilstrecken_Initiativen_InitiativeId",
                table: "Teilstrecken",
                column: "InitiativeId",
                principalTable: "Initiativen",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

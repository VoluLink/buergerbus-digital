using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    /// <inheritdoc />
    public partial class RemoveInitiativeIdFromFahrer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Fahrer_Initiativen_InitiativeId",
                table: "Fahrer");

            migrationBuilder.DropIndex(
                name: "IX_Fahrer_InitiativeId",
                table: "Fahrer");

            migrationBuilder.DropColumn(
                name: "Fuehrerscheinklasse",
                table: "Fahrer");

            migrationBuilder.DropColumn(
                name: "InitiativeId",
                table: "Fahrer");

            migrationBuilder.DropColumn(
                name: "LetzteG25",
                table: "Fahrer");

            migrationBuilder.DropColumn(
                name: "NaechsteG25",
                table: "Fahrer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Fuehrerscheinklasse",
                table: "Fahrer",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "InitiativeId",
                table: "Fahrer",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LetzteG25",
                table: "Fahrer",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NaechsteG25",
                table: "Fahrer",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Fahrer_InitiativeId",
                table: "Fahrer",
                column: "InitiativeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Fahrer_Initiativen_InitiativeId",
                table: "Fahrer",
                column: "InitiativeId",
                principalTable: "Initiativen",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

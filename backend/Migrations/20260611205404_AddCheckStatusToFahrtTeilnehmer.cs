using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCheckStatusToFahrtTeilnehmer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AbgehaktAm",
                table: "FahrtTeilnehmer",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IstAbgehakt",
                table: "FahrtTeilnehmer",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AbgehaktAm",
                table: "FahrtTeilnehmer");

            migrationBuilder.DropColumn(
                name: "IstAbgehakt",
                table: "FahrtTeilnehmer");
        }
    }
}

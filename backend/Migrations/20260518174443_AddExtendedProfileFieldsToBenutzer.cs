using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddExtendedProfileFieldsToBenutzer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Adresse",
                table: "Benutzer",
                newName: "Strasse");

            migrationBuilder.AddColumn<string>(
                name: "Fuehrerscheinklasse",
                table: "Benutzer",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "LetzteG25",
                table: "Benutzer",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NaechsteG25",
                table: "Benutzer",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Ort",
                table: "Benutzer",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Postleitzahl",
                table: "Benutzer",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Fuehrerscheinklasse",
                table: "Benutzer");

            migrationBuilder.DropColumn(
                name: "LetzteG25",
                table: "Benutzer");

            migrationBuilder.DropColumn(
                name: "NaechsteG25",
                table: "Benutzer");

            migrationBuilder.DropColumn(
                name: "Ort",
                table: "Benutzer");

            migrationBuilder.DropColumn(
                name: "Postleitzahl",
                table: "Benutzer");

            migrationBuilder.RenameColumn(
                name: "Strasse",
                table: "Benutzer",
                newName: "Adresse");
        }
    }
}

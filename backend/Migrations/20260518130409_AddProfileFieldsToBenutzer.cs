using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileFieldsToBenutzer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Adresse",
                table: "Fahrer");

            migrationBuilder.DropColumn(
                name: "Nachname",
                table: "Fahrer");

            migrationBuilder.DropColumn(
                name: "Telefonnummer",
                table: "Fahrer");

            migrationBuilder.DropColumn(
                name: "Vorname",
                table: "Fahrer");

            migrationBuilder.AlterColumn<DateTime>(
                name: "LetzteG25",
                table: "Fahrer",
                type: "datetime(6)",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)");

            migrationBuilder.AlterColumn<string>(
                name: "Fuehrerscheinklasse",
                table: "Fahrer",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Adresse",
                table: "Benutzer",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "Aktiv",
                table: "Benutzer",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "AngelegtAm",
                table: "Benutzer",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Bemerkung",
                table: "Benutzer",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "GeaendertAm",
                table: "Benutzer",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nachname",
                table: "Benutzer",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Telefonnummer",
                table: "Benutzer",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Vorname",
                table: "Benutzer",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Adresse",
                table: "Benutzer");

            migrationBuilder.DropColumn(
                name: "Aktiv",
                table: "Benutzer");

            migrationBuilder.DropColumn(
                name: "AngelegtAm",
                table: "Benutzer");

            migrationBuilder.DropColumn(
                name: "Bemerkung",
                table: "Benutzer");

            migrationBuilder.DropColumn(
                name: "GeaendertAm",
                table: "Benutzer");

            migrationBuilder.DropColumn(
                name: "Nachname",
                table: "Benutzer");

            migrationBuilder.DropColumn(
                name: "Telefonnummer",
                table: "Benutzer");

            migrationBuilder.DropColumn(
                name: "Vorname",
                table: "Benutzer");

            migrationBuilder.AlterColumn<DateTime>(
                name: "LetzteG25",
                table: "Fahrer",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Fahrer",
                keyColumn: "Fuehrerscheinklasse",
                keyValue: null,
                column: "Fuehrerscheinklasse",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "Fuehrerscheinklasse",
                table: "Fahrer",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Adresse",
                table: "Fahrer",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Nachname",
                table: "Fahrer",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Telefonnummer",
                table: "Fahrer",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Vorname",
                table: "Fahrer",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddDatumBisToFahrten : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DatumBis",
                table: "Fahrten",
                type: "datetime(6)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DatumBis",
                table: "Fahrten");
        }
    }
}

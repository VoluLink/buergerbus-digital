using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    /// <inheritdoc />
    public partial class MakeFahrerFahrzeugNullableBeiFahrt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Fahrten_Fahrer_FahrerId",
                table: "Fahrten");

            migrationBuilder.DropForeignKey(
                name: "FK_Fahrten_Fahrzeuge_FahrzeugId",
                table: "Fahrten");

            migrationBuilder.AlterColumn<int>(
                name: "FahrzeugId",
                table: "Fahrten",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "FahrerId",
                table: "Fahrten",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Fahrten_Fahrer_FahrerId",
                table: "Fahrten",
                column: "FahrerId",
                principalTable: "Fahrer",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Fahrten_Fahrzeuge_FahrzeugId",
                table: "Fahrten",
                column: "FahrzeugId",
                principalTable: "Fahrzeuge",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Fahrten_Fahrer_FahrerId",
                table: "Fahrten");

            migrationBuilder.DropForeignKey(
                name: "FK_Fahrten_Fahrzeuge_FahrzeugId",
                table: "Fahrten");

            migrationBuilder.AlterColumn<int>(
                name: "FahrzeugId",
                table: "Fahrten",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "FahrerId",
                table: "Fahrten",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Fahrten_Fahrer_FahrerId",
                table: "Fahrten",
                column: "FahrerId",
                principalTable: "Fahrer",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Fahrten_Fahrzeuge_FahrzeugId",
                table: "Fahrten",
                column: "FahrzeugId",
                principalTable: "Fahrzeuge",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

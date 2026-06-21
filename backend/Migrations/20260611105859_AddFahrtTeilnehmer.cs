using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddFahrtTeilnehmer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Teilstrecken_Fahrgaeste_FahrgastId",
                table: "Teilstrecken");

            migrationBuilder.AlterColumn<int>(
                name: "FahrgastId",
                table: "Teilstrecken",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "FahrtTeilnehmerId",
                table: "Teilstrecken",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FahrtTeilnehmer",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FahrtId = table.Column<int>(type: "int", nullable: false),
                    FahrgastId = table.Column<int>(type: "int", nullable: true),
                    Vorname = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nachname = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Adresse = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Telefonnummer = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IstTemporaer = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AlsStammgastGespeichert = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FahrtTeilnehmer", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FahrtTeilnehmer_Fahrgaeste_FahrgastId",
                        column: x => x.FahrgastId,
                        principalTable: "Fahrgaeste",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FahrtTeilnehmer_Fahrten_FahrtId",
                        column: x => x.FahrtId,
                        principalTable: "Fahrten",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Teilstrecken_FahrtTeilnehmerId",
                table: "Teilstrecken",
                column: "FahrtTeilnehmerId");

            migrationBuilder.CreateIndex(
                name: "IX_FahrtTeilnehmer_FahrgastId",
                table: "FahrtTeilnehmer",
                column: "FahrgastId");

            migrationBuilder.CreateIndex(
                name: "IX_FahrtTeilnehmer_FahrtId",
                table: "FahrtTeilnehmer",
                column: "FahrtId");

            migrationBuilder.AddForeignKey(
                name: "FK_Teilstrecken_Fahrgaeste_FahrgastId",
                table: "Teilstrecken",
                column: "FahrgastId",
                principalTable: "Fahrgaeste",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Teilstrecken_FahrtTeilnehmer_FahrtTeilnehmerId",
                table: "Teilstrecken",
                column: "FahrtTeilnehmerId",
                principalTable: "FahrtTeilnehmer",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Teilstrecken_Fahrgaeste_FahrgastId",
                table: "Teilstrecken");

            migrationBuilder.DropForeignKey(
                name: "FK_Teilstrecken_FahrtTeilnehmer_FahrtTeilnehmerId",
                table: "Teilstrecken");

            migrationBuilder.DropTable(
                name: "FahrtTeilnehmer");

            migrationBuilder.DropIndex(
                name: "IX_Teilstrecken_FahrtTeilnehmerId",
                table: "Teilstrecken");

            migrationBuilder.DropColumn(
                name: "FahrtTeilnehmerId",
                table: "Teilstrecken");

            migrationBuilder.AlterColumn<int>(
                name: "FahrgastId",
                table: "Teilstrecken",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Teilstrecken_Fahrgaeste_FahrgastId",
                table: "Teilstrecken",
                column: "FahrgastId",
                principalTable: "Fahrgaeste",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

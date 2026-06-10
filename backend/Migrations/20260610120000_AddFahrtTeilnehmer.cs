using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    public partial class AddFahrtTeilnehmer : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                    IstTemporaer = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    AlsStammgastGespeichert = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FahrtTeilnehmer", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FahrtTeilnehmer_Fahrgaeste_FahrgastId",
                        column: x => x.FahrgastId,
                        principalTable: "Fahrgaeste",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_FahrtTeilnehmer_Fahrten_FahrtId",
                        column: x => x.FahrtId,
                        principalTable: "Fahrten",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_FahrtTeilnehmer_FahrtId",
                table: "FahrtTeilnehmer",
                column: "FahrtId");

            migrationBuilder.CreateIndex(
                name: "IX_FahrtTeilnehmer_FahrgastId",
                table: "FahrtTeilnehmer",
                column: "FahrgastId");

            migrationBuilder.Sql(@"
                INSERT INTO FahrtTeilnehmer (FahrtId, FahrgastId, Vorname, Nachname, Adresse, Telefonnummer, IstTemporaer, AlsStammgastGespeichert)
                SELECT DISTINCT
                    t.FahrtId,
                    t.FahrgastId,
                    f.Vorname,
                    f.Nachname,
                    f.Adresse,
                    f.Telefonnummer,
                    0,
                    0
                FROM Teilstrecken t
                INNER JOIN Fahrgaeste f ON f.Id = t.FahrgastId;

                UPDATE Teilstrecken t
                INNER JOIN FahrtTeilnehmer ft
                    ON ft.FahrtId = t.FahrtId
                   AND ft.FahrgastId = t.FahrgastId
                SET t.FahrtTeilnehmerId = ft.Id;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Teilstrecken_FahrtTeilnehmerId",
                table: "Teilstrecken",
                column: "FahrtTeilnehmerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Teilstrecken_FahrtTeilnehmer_FahrtTeilnehmerId",
                table: "Teilstrecken",
                column: "FahrtTeilnehmerId",
                principalTable: "FahrtTeilnehmer",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
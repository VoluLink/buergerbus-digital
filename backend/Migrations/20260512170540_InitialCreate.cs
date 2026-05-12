using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Initiativen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Beschreibung = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AngelegtAm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    GeaendertAm = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Initiativen", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Rollen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Rollenname = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rollen", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Benutzer",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nutzername = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PasswortHash = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    InitiativeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Benutzer", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Benutzer_Initiativen_InitiativeId",
                        column: x => x.InitiativeId,
                        principalTable: "Initiativen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Fahrgaeste",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Vorname = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nachname = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Adresse = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Telefonnummer = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Bemerkung = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AngelegtAm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    GeaendertAm = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    LetzteNutzung = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Aktiv = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    InitiativeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fahrgaeste", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Fahrgaeste_Initiativen_InitiativeId",
                        column: x => x.InitiativeId,
                        principalTable: "Initiativen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Fahrzeuge",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Kennzeichen = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Bezeichnung = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Kapazitaet = table.Column<byte>(type: "tinyint unsigned", nullable: false),
                    Kilometerstand = table.Column<int>(type: "int", nullable: false),
                    Betriebsaufnahme = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Bemerkung = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Aktiv = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    InitiativeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fahrzeuge", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Fahrzeuge_Initiativen_InitiativeId",
                        column: x => x.InitiativeId,
                        principalTable: "Initiativen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Benachrichtigungen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Titel = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nachricht = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Typ = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReferenzId = table.Column<int>(type: "int", nullable: true),
                    ErstelltAm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Gelesen = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    BenutzerId = table.Column<int>(type: "int", nullable: false),
                    InitiativeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Benachrichtigungen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Benachrichtigungen_Benutzer_BenutzerId",
                        column: x => x.BenutzerId,
                        principalTable: "Benutzer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Benachrichtigungen_Initiativen_InitiativeId",
                        column: x => x.InitiativeId,
                        principalTable: "Initiativen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "BenutzerRollen",
                columns: table => new
                {
                    BenutzerId = table.Column<int>(type: "int", nullable: false),
                    RolleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BenutzerRollen", x => new { x.BenutzerId, x.RolleId });
                    table.ForeignKey(
                        name: "FK_BenutzerRollen_Benutzer_BenutzerId",
                        column: x => x.BenutzerId,
                        principalTable: "Benutzer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BenutzerRollen_Rollen_RolleId",
                        column: x => x.RolleId,
                        principalTable: "Rollen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Fahrer",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Vorname = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nachname = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Adresse = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Telefonnummer = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Fuehrerscheinklasse = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LetzteG25 = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    NaechsteG25 = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Bemerkung = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AngelegtAm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    GeaendertAm = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Aktiv = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    BenutzerId = table.Column<int>(type: "int", nullable: false),
                    InitiativeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fahrer", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Fahrer_Benutzer_BenutzerId",
                        column: x => x.BenutzerId,
                        principalTable: "Benutzer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Fahrer_Initiativen_InitiativeId",
                        column: x => x.InitiativeId,
                        principalTable: "Initiativen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Loeschfristen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    LoeschenAm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    GeloeschtAm = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Grund = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FahrgastId = table.Column<int>(type: "int", nullable: false),
                    InitiativeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Loeschfristen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Loeschfristen_Fahrgaeste_FahrgastId",
                        column: x => x.FahrgastId,
                        principalTable: "Fahrgaeste",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Loeschfristen_Initiativen_InitiativeId",
                        column: x => x.InitiativeId,
                        principalTable: "Initiativen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Schaeden",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Beschreibung = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Enstanden_Am = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Behoben_Am = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FahrzeugId = table.Column<int>(type: "int", nullable: false),
                    InitiativeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Schaeden", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Schaeden_Fahrzeuge_FahrzeugId",
                        column: x => x.FahrzeugId,
                        principalTable: "Fahrzeuge",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Schaeden_Initiativen_InitiativeId",
                        column: x => x.InitiativeId,
                        principalTable: "Initiativen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Wartungen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    LetzterTermin = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    NaechsterTermin = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Grund = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ort = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Kosten = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    FahrzeugId = table.Column<int>(type: "int", nullable: false),
                    InitiativeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Wartungen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Wartungen_Fahrzeuge_FahrzeugId",
                        column: x => x.FahrzeugId,
                        principalTable: "Fahrzeuge",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Wartungen_Initiativen_InitiativeId",
                        column: x => x.InitiativeId,
                        principalTable: "Initiativen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FahrerFahrzeuge",
                columns: table => new
                {
                    FahrerId = table.Column<int>(type: "int", nullable: false),
                    FahrzeugId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FahrerFahrzeuge", x => new { x.FahrerId, x.FahrzeugId });
                    table.ForeignKey(
                        name: "FK_FahrerFahrzeuge_Fahrer_FahrerId",
                        column: x => x.FahrerId,
                        principalTable: "Fahrer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FahrerFahrzeuge_Fahrzeuge_FahrzeugId",
                        column: x => x.FahrzeugId,
                        principalTable: "Fahrzeuge",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Fahrten",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Titel = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Datum = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Zielort = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Fahrttyp = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Startzeit = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Endzeit = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Bemerkung = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AngelegtAm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AngelegtVon = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FahrerId = table.Column<int>(type: "int", nullable: false),
                    FahrzeugId = table.Column<int>(type: "int", nullable: false),
                    InitiativeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fahrten", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Fahrten_Fahrer_FahrerId",
                        column: x => x.FahrerId,
                        principalTable: "Fahrer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Fahrten_Fahrzeuge_FahrzeugId",
                        column: x => x.FahrzeugId,
                        principalTable: "Fahrzeuge",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Fahrten_Initiativen_InitiativeId",
                        column: x => x.InitiativeId,
                        principalTable: "Initiativen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Teilstrecken",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Abholadresse = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Zieladresse = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Startzeit = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Endzeit = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Reihenfolge = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FahrtId = table.Column<int>(type: "int", nullable: false),
                    FahrgastId = table.Column<int>(type: "int", nullable: false),
                    InitiativeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teilstrecken", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Teilstrecken_Fahrgaeste_FahrgastId",
                        column: x => x.FahrgastId,
                        principalTable: "Fahrgaeste",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Teilstrecken_Fahrten_FahrtId",
                        column: x => x.FahrtId,
                        principalTable: "Fahrten",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Teilstrecken_Initiativen_InitiativeId",
                        column: x => x.InitiativeId,
                        principalTable: "Initiativen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Benachrichtigungen_BenutzerId",
                table: "Benachrichtigungen",
                column: "BenutzerId");

            migrationBuilder.CreateIndex(
                name: "IX_Benachrichtigungen_InitiativeId",
                table: "Benachrichtigungen",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_Benutzer_InitiativeId",
                table: "Benutzer",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_BenutzerRollen_RolleId",
                table: "BenutzerRollen",
                column: "RolleId");

            migrationBuilder.CreateIndex(
                name: "IX_Fahrer_BenutzerId",
                table: "Fahrer",
                column: "BenutzerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Fahrer_InitiativeId",
                table: "Fahrer",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_FahrerFahrzeuge_FahrzeugId",
                table: "FahrerFahrzeuge",
                column: "FahrzeugId");

            migrationBuilder.CreateIndex(
                name: "IX_Fahrgaeste_InitiativeId",
                table: "Fahrgaeste",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_Fahrten_FahrerId",
                table: "Fahrten",
                column: "FahrerId");

            migrationBuilder.CreateIndex(
                name: "IX_Fahrten_FahrzeugId",
                table: "Fahrten",
                column: "FahrzeugId");

            migrationBuilder.CreateIndex(
                name: "IX_Fahrten_InitiativeId",
                table: "Fahrten",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_Fahrzeuge_InitiativeId",
                table: "Fahrzeuge",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_Loeschfristen_FahrgastId",
                table: "Loeschfristen",
                column: "FahrgastId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Loeschfristen_InitiativeId",
                table: "Loeschfristen",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_Schaeden_FahrzeugId",
                table: "Schaeden",
                column: "FahrzeugId");

            migrationBuilder.CreateIndex(
                name: "IX_Schaeden_InitiativeId",
                table: "Schaeden",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_Teilstrecken_FahrgastId",
                table: "Teilstrecken",
                column: "FahrgastId");

            migrationBuilder.CreateIndex(
                name: "IX_Teilstrecken_FahrtId_FahrgastId",
                table: "Teilstrecken",
                columns: new[] { "FahrtId", "FahrgastId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teilstrecken_InitiativeId",
                table: "Teilstrecken",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_Wartungen_FahrzeugId",
                table: "Wartungen",
                column: "FahrzeugId");

            migrationBuilder.CreateIndex(
                name: "IX_Wartungen_InitiativeId",
                table: "Wartungen",
                column: "InitiativeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Benachrichtigungen");

            migrationBuilder.DropTable(
                name: "BenutzerRollen");

            migrationBuilder.DropTable(
                name: "FahrerFahrzeuge");

            migrationBuilder.DropTable(
                name: "Loeschfristen");

            migrationBuilder.DropTable(
                name: "Schaeden");

            migrationBuilder.DropTable(
                name: "Teilstrecken");

            migrationBuilder.DropTable(
                name: "Wartungen");

            migrationBuilder.DropTable(
                name: "Rollen");

            migrationBuilder.DropTable(
                name: "Fahrgaeste");

            migrationBuilder.DropTable(
                name: "Fahrten");

            migrationBuilder.DropTable(
                name: "Fahrer");

            migrationBuilder.DropTable(
                name: "Fahrzeuge");

            migrationBuilder.DropTable(
                name: "Benutzer");

            migrationBuilder.DropTable(
                name: "Initiativen");
        }
    }
}

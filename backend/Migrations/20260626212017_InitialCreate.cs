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
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Type = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Subject = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Message = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RecipientGroup = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
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
                name: "SitePages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Slug = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Title = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Content = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsPublished = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ShowInFooter = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    FooterSortOrder = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SitePages", x => x.Id);
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
                    Vorname = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nachname = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Strasse = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Postleitzahl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ort = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Telefonnummer = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Fuehrerscheinklasse = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LetzteG25 = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    NaechsteG25 = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Bemerkung = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AngelegtAm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    GeaendertAm = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Aktiv = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    InitiativeId = table.Column<int>(type: "int", nullable: false),
                    AktiveRolle = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
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
                    LetzteNutzung = table.Column<DateTime>(type: "datetime(6)", nullable: true),
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
                name: "NotificationRecipients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    NotificationId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Email = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DisplayName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ErrorMessage = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SentAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationRecipients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationRecipients_Notifications_NotificationId",
                        column: x => x.NotificationId,
                        principalTable: "Notifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FooterLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Label = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LinkType = table.Column<int>(type: "int", nullable: false),
                    SitePageId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    ExternalUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    OpenInNewTab = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FooterLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FooterLinks_SitePages_SitePageId",
                        column: x => x.SitePageId,
                        principalTable: "SitePages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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
                    Bemerkung = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AngelegtAm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    GeaendertAm = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Aktiv = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    BenutzerId = table.Column<int>(type: "int", nullable: false)
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
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PasswordResetTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExpiresAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResetTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasswordResetTokens_Benutzer_UserId",
                        column: x => x.UserId,
                        principalTable: "Benutzer",
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
                    AngelegtVonUserId = table.Column<int>(type: "int", nullable: false),
                    FahrerId = table.Column<int>(type: "int", nullable: true),
                    FahrzeugId = table.Column<int>(type: "int", nullable: true),
                    InitiativeId = table.Column<int>(type: "int", nullable: false),
                    DatumBis = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fahrten", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Fahrten_Benutzer_AngelegtVonUserId",
                        column: x => x.AngelegtVonUserId,
                        principalTable: "Benutzer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Fahrten_Fahrer_FahrerId",
                        column: x => x.FahrerId,
                        principalTable: "Fahrer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Fahrten_Fahrzeuge_FahrzeugId",
                        column: x => x.FahrzeugId,
                        principalTable: "Fahrzeuge",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Fahrten_Initiativen_InitiativeId",
                        column: x => x.InitiativeId,
                        principalTable: "Initiativen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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
                    IstAbgehakt = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AbgehaktAm = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    IstTemporaer = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AlsStammgastGespeichert = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AnonymisiertAm = table.Column<DateTime>(type: "datetime(6)", nullable: true)
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
                    FahrtTeilnehmerId = table.Column<int>(type: "int", nullable: true),
                    FahrtId = table.Column<int>(type: "int", nullable: false),
                    FahrgastId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teilstrecken", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Teilstrecken_Fahrgaeste_FahrgastId",
                        column: x => x.FahrgastId,
                        principalTable: "Fahrgaeste",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Teilstrecken_FahrtTeilnehmer_FahrtTeilnehmerId",
                        column: x => x.FahrtTeilnehmerId,
                        principalTable: "FahrtTeilnehmer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Teilstrecken_Fahrten_FahrtId",
                        column: x => x.FahrtId,
                        principalTable: "Fahrten",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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
                name: "IX_Fahrgaeste_InitiativeId",
                table: "Fahrgaeste",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_Fahrten_AngelegtVonUserId",
                table: "Fahrten",
                column: "AngelegtVonUserId");

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
                name: "IX_FahrtTeilnehmer_FahrgastId",
                table: "FahrtTeilnehmer",
                column: "FahrgastId");

            migrationBuilder.CreateIndex(
                name: "IX_FahrtTeilnehmer_FahrtId",
                table: "FahrtTeilnehmer",
                column: "FahrtId");

            migrationBuilder.CreateIndex(
                name: "IX_Fahrzeuge_InitiativeId",
                table: "Fahrzeuge",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_FooterLinks_IsActive_SortOrder",
                table: "FooterLinks",
                columns: new[] { "IsActive", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_FooterLinks_SitePageId",
                table: "FooterLinks",
                column: "SitePageId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipients_NotificationId_UserId",
                table: "NotificationRecipients",
                columns: new[] { "NotificationId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_TokenHash",
                table: "PasswordResetTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId",
                table: "PasswordResetTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Schaeden_FahrzeugId",
                table: "Schaeden",
                column: "FahrzeugId");

            migrationBuilder.CreateIndex(
                name: "IX_Schaeden_InitiativeId",
                table: "Schaeden",
                column: "InitiativeId");

            migrationBuilder.CreateIndex(
                name: "IX_SitePages_Slug",
                table: "SitePages",
                column: "Slug",
                unique: true);

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
                name: "IX_Teilstrecken_FahrtTeilnehmerId",
                table: "Teilstrecken",
                column: "FahrtTeilnehmerId");

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
                name: "BenutzerRollen");

            migrationBuilder.DropTable(
                name: "FooterLinks");

            migrationBuilder.DropTable(
                name: "NotificationRecipients");

            migrationBuilder.DropTable(
                name: "PasswordResetTokens");

            migrationBuilder.DropTable(
                name: "Schaeden");

            migrationBuilder.DropTable(
                name: "Teilstrecken");

            migrationBuilder.DropTable(
                name: "Wartungen");

            migrationBuilder.DropTable(
                name: "Rollen");

            migrationBuilder.DropTable(
                name: "SitePages");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "FahrtTeilnehmer");

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

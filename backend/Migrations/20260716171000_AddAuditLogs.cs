using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations;

/// <summary>Additive, privacy-minimised audit table; no existing rows are modified.</summary>
public partial class AddAuditLogs : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "AuditLogs",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false).Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                UserId = table.Column<int>(type: "int", nullable: true),
                Action = table.Column<string>(type: "longtext", nullable: false),
                EntityType = table.Column<string>(type: "longtext", nullable: false),
                EntityId = table.Column<string>(type: "longtext", nullable: true),
                InitiativeId = table.Column<int>(type: "int", nullable: true),
                TimestampUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                Result = table.Column<string>(type: "longtext", nullable: false),
                CorrelationId = table.Column<string>(type: "longtext", nullable: true),
                MetadataJson = table.Column<string>(type: "longtext", nullable: true)
            },
            constraints: table => table.PrimaryKey("PK_AuditLogs", x => x.Id));
        migrationBuilder.CreateIndex(name: "IX_AuditLogs_TimestampUtc_Action", table: "AuditLogs", columns: new[] { "TimestampUtc", "Action" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropTable(name: "AuditLogs");
}

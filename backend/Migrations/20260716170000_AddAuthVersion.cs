using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations;

/// <summary>Additive token invalidation version; no existing data is removed.</summary>
public partial class AddAuthVersion : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "AuthVersion",
            table: "Benutzer",
            type: "int",
            nullable: false,
            defaultValue: 0);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropColumn(name: "AuthVersion", table: "Benutzer");
}

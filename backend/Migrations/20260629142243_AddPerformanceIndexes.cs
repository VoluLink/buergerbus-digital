using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuergerbusAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Fahrten_InitiativeId",
                table: "Fahrten");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_CreatedAt",
                table: "Notifications",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipients_UserId",
                table: "NotificationRecipients",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Fahrten_InitiativeId_Datum",
                table: "Fahrten",
                columns: new[] { "InitiativeId", "Datum" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Notifications_CreatedAt",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_NotificationRecipients_UserId",
                table: "NotificationRecipients");

            migrationBuilder.DropIndex(
                name: "IX_Fahrten_InitiativeId_Datum",
                table: "Fahrten");

            migrationBuilder.CreateIndex(
                name: "IX_Fahrten_InitiativeId",
                table: "Fahrten",
                column: "InitiativeId");
        }
    }
}

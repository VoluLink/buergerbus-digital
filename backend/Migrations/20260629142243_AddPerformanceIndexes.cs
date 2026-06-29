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
            // Wichtig für MySQL/MariaDB:
            // Erst den neuen zusammengesetzten Index erstellen,
            // dann den alten Foreign-Key-Index löschen.
            migrationBuilder.CreateIndex(
                name: "IX_Fahrten_InitiativeId_Datum",
                table: "Fahrten",
                columns: new[] { "InitiativeId", "Datum" });

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Auch rückwärts erst Ersatzindex erstellen,
            // bevor der zusammengesetzte Index entfernt wird.
            migrationBuilder.CreateIndex(
                name: "IX_Fahrten_InitiativeId",
                table: "Fahrten",
                column: "InitiativeId");

            migrationBuilder.DropIndex(
                name: "IX_Fahrten_InitiativeId_Datum",
                table: "Fahrten");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_CreatedAt",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_NotificationRecipients_UserId",
                table: "NotificationRecipients");
        }
    }
}
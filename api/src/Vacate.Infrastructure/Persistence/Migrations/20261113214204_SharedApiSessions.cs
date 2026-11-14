using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vacate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SharedApiSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ApiSessions",
                columns: table => new
                {
                    TokenHash = table.Column<string>(type: "char(64)", nullable: false, collation: "Latin1_General_100_BIN2"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiSessions", x => x.TokenHash);
                    table.CheckConstraint("CK_ApiSessions_Expiry", "[ExpiresAt] > [CreatedAt] AND DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [ExpiresAt]) = 0");
                    table.CheckConstraint("CK_ApiSessions_Hash", "LEN([TokenHash]) = 64 AND [TokenHash] NOT LIKE '%[^0-9A-F]%' COLLATE Latin1_General_100_BIN2");
                    table.ForeignKey(
                        name: "FK_ApiSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApiSessions_ExpiresAt",
                table: "ApiSessions",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ApiSessions_UserId",
                table: "ApiSessions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApiSessions");
        }
    }
}

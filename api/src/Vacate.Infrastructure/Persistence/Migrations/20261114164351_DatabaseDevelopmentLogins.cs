using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vacate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DatabaseDevelopmentLogins : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DevelopmentLogins",
                columns: table => new
                {
                    Alias = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_BIN2"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Enabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Advertise = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DevelopmentLogins", x => x.Alias);
                    table.CheckConstraint("CK_DevelopmentLogins_Alias", "LEN([Alias]) > 0 AND [Alias] = LOWER(LTRIM(RTRIM([Alias]))) COLLATE Latin1_General_100_BIN2");
                    table.CheckConstraint("CK_DevelopmentLogins_Utc", "[UpdatedAt] >= [CreatedAt] AND DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0");
                    table.ForeignKey(
                        name: "FK_DevelopmentLogins_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DevelopmentLogins_UserId",
                table: "DevelopmentLogins",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DevelopmentLogins");
        }
    }
}

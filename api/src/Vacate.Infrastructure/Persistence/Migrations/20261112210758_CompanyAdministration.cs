using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vacate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CompanyAdministration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence<int>(
                name: "CompanyApproverIds");

            migrationBuilder.CreateSequence<int>(
                name: "CompanyClosureIds");

            migrationBuilder.CreateSequence<int>(
                name: "CompanyHolidayIds");

            migrationBuilder.AddColumn<Guid>(
                name: "ApproverGuid",
                table: "LeaveRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ClosureGuid",
                table: "LeaveRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DecidedAt",
                table: "LeaveRequests",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "LeaveRequests",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "EmployeeRequest");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Users_Guid",
                table: "Users",
                column: "Guid");

            migrationBuilder.CreateTable(
                name: "CompanyApproverAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Scope = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    ScopeGuid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApproverGuid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeleteRequestedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyApproverAssignments", x => x.Id);
                    table.CheckConstraint("CK_CompanyApproverAssignments_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_CompanyApproverAssignments_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
                    table.CheckConstraint("CK_CompanyApproverAssignments_Scope", "[Scope] IN (N'organization', N'department', N'team') AND [ScopeGuid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_CompanyApproverAssignments_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
                    table.ForeignKey(
                        name: "FK_CompanyApproverAssignments_Organizations_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Organizations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CompanyApproverAssignments_Users_ApproverGuid",
                        column: x => x.ApproverGuid,
                        principalTable: "Users",
                        principalColumn: "Guid");
                });

            migrationBuilder.CreateTable(
                name: "CompanyClosures",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    DeductAnnualLeave = table.Column<bool>(type: "bit", nullable: false),
                    IdempotencyKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeleteRequestedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyClosures", x => x.Id);
                    table.UniqueConstraint("AK_CompanyClosures_CompanyId_Id", x => new { x.CompanyId, x.Id });
                    table.CheckConstraint("CK_CompanyClosures_Date", "LEN([Name]) > 0 AND [EndDate] >= [StartDate] AND DATEDIFF(day, [StartDate], [EndDate]) <= 366");
                    table.CheckConstraint("CK_CompanyClosures_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_CompanyClosures_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
                    table.CheckConstraint("CK_CompanyClosures_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
                    table.ForeignKey(
                        name: "FK_CompanyClosures_Organizations_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Organizations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CompanyHolidays",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Month = table.Column<int>(type: "int", nullable: false),
                    Day = table.Column<int>(type: "int", nullable: false),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeleteRequestedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyHolidays", x => x.Id);
                    table.CheckConstraint("CK_CompanyHolidays_Date", "LEN([Name]) > 0 AND [Month] BETWEEN 1 AND 12 AND [Day] BETWEEN 1 AND CASE WHEN [Month] = 2 THEN 29 WHEN [Month] IN (4,6,9,11) THEN 30 ELSE 31 END");
                    table.CheckConstraint("CK_CompanyHolidays_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_CompanyHolidays_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
                    table.CheckConstraint("CK_CompanyHolidays_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
                    table.ForeignKey(
                        name: "FK_CompanyHolidays_Organizations_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Organizations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CompanyClosureResults",
                columns: table => new
                {
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    ClosureId = table.Column<int>(type: "int", nullable: false),
                    UserGuid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(401)", maxLength: 401, nullable: false),
                    Outcome = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    Days = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyClosureResults", x => new { x.CompanyId, x.ClosureId, x.UserGuid });
                    table.CheckConstraint("CK_CompanyClosureResults_Outcome", "[Days] >= 0 AND [Outcome] IN (N'recorded', N'skipped', N'already-covered')");
                    table.ForeignKey(
                        name: "FK_CompanyClosureResults_CompanyClosures_CompanyId_ClosureId",
                        columns: x => new { x.CompanyId, x.ClosureId },
                        principalTable: "CompanyClosures",
                        principalColumns: new[] { "CompanyId", "Id" });
                });

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_CompanyId_ApproverGuid",
                table: "LeaveRequests",
                columns: new[] { "CompanyId", "ApproverGuid" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_LeaveRequests_DecisionUtc",
                table: "LeaveRequests",
                sql: "[DecidedAt] IS NULL OR ([DecidedAt] >= [CreatedAt] AND DATEPART(TZOFFSET, [DecidedAt]) = 0)");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyApproverAssignments_ApproverGuid",
                table: "CompanyApproverAssignments",
                column: "ApproverGuid");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyApproverAssignments_CompanyId_Scope_ScopeGuid",
                table: "CompanyApproverAssignments",
                columns: new[] { "CompanyId", "Scope", "ScopeGuid" },
                unique: true,
                filter: "[DeletedAt] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyApproverAssignments_Guid",
                table: "CompanyApproverAssignments",
                column: "Guid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompanyClosures_CompanyId_IdempotencyKey",
                table: "CompanyClosures",
                columns: new[] { "CompanyId", "IdempotencyKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompanyClosures_Guid",
                table: "CompanyClosures",
                column: "Guid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompanyHolidays_CompanyId_Month_Day",
                table: "CompanyHolidays",
                columns: new[] { "CompanyId", "Month", "Day" },
                unique: true,
                filter: "[DeletedAt] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyHolidays_Guid",
                table: "CompanyHolidays",
                column: "Guid",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompanyApproverAssignments");

            migrationBuilder.DropTable(
                name: "CompanyClosureResults");

            migrationBuilder.DropTable(
                name: "CompanyHolidays");

            migrationBuilder.DropTable(
                name: "CompanyClosures");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Users_Guid",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_LeaveRequests_CompanyId_ApproverGuid",
                table: "LeaveRequests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LeaveRequests_DecisionUtc",
                table: "LeaveRequests");

            migrationBuilder.DropColumn(
                name: "ApproverGuid",
                table: "LeaveRequests");

            migrationBuilder.DropColumn(
                name: "ClosureGuid",
                table: "LeaveRequests");

            migrationBuilder.DropColumn(
                name: "DecidedAt",
                table: "LeaveRequests");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "LeaveRequests");

            migrationBuilder.DropSequence(
                name: "CompanyApproverIds");

            migrationBuilder.DropSequence(
                name: "CompanyClosureIds");

            migrationBuilder.DropSequence(
                name: "CompanyHolidayIds");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vacate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LeaveRequestSubmission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CountryCode",
                table: "Organizations",
                type: "nvarchar(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TimeZone",
                table: "Organizations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "UTC");

            migrationBuilder.AddColumn<int>(
                name: "EntitlementYear",
                table: "Leaves",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LeaveTypeId",
                table: "Leaves",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "annual");

            migrationBuilder.AddColumn<int>(
                name: "RequestId",
                table: "Leaves",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CoveredLeaveSubmissions",
                columns: table => new
                {
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    MembershipId = table.Column<int>(type: "int", nullable: false),
                    IdempotencyKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Fingerprint = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoveredLeaveSubmissions", x => new { x.CompanyId, x.MembershipId, x.IdempotencyKey });
                    table.ForeignKey(
                        name: "FK_CoveredLeaveSubmissions_Memberships_CompanyId_MembershipId",
                        columns: x => new { x.CompanyId, x.MembershipId },
                        principalTable: "Memberships",
                        principalColumns: new[] { "CompanyId", "Id" });
                });

            migrationBuilder.CreateTable(
                name: "LeaveEntitlementPeriods",
                columns: table => new
                {
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    MembershipId = table.Column<int>(type: "int", nullable: false),
                    LeaveTypeId = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    Allocation = table.Column<decimal>(type: "decimal(12,4)", precision: 12, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaveEntitlementPeriods", x => new { x.CompanyId, x.MembershipId, x.LeaveTypeId, x.Year });
                    table.CheckConstraint("CK_LeaveEntitlementPeriods_Allocation", "[Allocation] >= 0 AND [Year] BETWEEN 1 AND 9999");
                    table.ForeignKey(
                        name: "FK_LeaveEntitlementPeriods_Memberships_CompanyId_MembershipId",
                        columns: x => new { x.CompanyId, x.MembershipId },
                        principalTable: "Memberships",
                        principalColumns: new[] { "CompanyId", "Id" });
                });

            migrationBuilder.CreateTable(
                name: "LeaveRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    MembershipId = table.Column<int>(type: "int", nullable: false),
                    IdempotencyKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Fingerprint = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    LeaveTypeId = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaveRequests", x => x.Id);
                    table.UniqueConstraint("AK_LeaveRequests_CompanyId_MembershipId_Id", x => new { x.CompanyId, x.MembershipId, x.Id });
                    table.ForeignKey(
                        name: "FK_LeaveRequests_Memberships_CompanyId_MembershipId",
                        columns: x => new { x.CompanyId, x.MembershipId },
                        principalTable: "Memberships",
                        principalColumns: new[] { "CompanyId", "Id" });
                });

            migrationBuilder.CreateTable(
                name: "PublicHolidays",
                columns: table => new
                {
                    CountryCode = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicHolidays", x => new { x.CountryCode, x.Date });
                });

            migrationBuilder.CreateIndex(
                name: "IX_Leaves_CompanyId_MembershipId_RequestId",
                table: "Leaves",
                columns: new[] { "CompanyId", "MembershipId", "RequestId" });

            migrationBuilder.CreateIndex(
                name: "IX_Leaves_CompanyId_MembershipId_StartDate",
                table: "Leaves",
                columns: new[] { "CompanyId", "MembershipId", "StartDate" },
                unique: true,
                filter: "[RequestId] IS NOT NULL AND [Status] IN (N'Used', N'Pending')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Leaves_RequestDate",
                table: "Leaves",
                sql: "[RequestId] IS NULL OR ([EntryKind] = N'RecordedLeave' AND [StartDate] = [EndDate] AND [QuantityDays] = 1 AND [EntitlementYear] BETWEEN 1 AND 9999)");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_CompanyId_MembershipId_IdempotencyKey",
                table: "LeaveRequests",
                columns: new[] { "CompanyId", "MembershipId", "IdempotencyKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_Guid",
                table: "LeaveRequests",
                column: "Guid",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Leaves_LeaveRequests_CompanyId_MembershipId_RequestId",
                table: "Leaves",
                columns: new[] { "CompanyId", "MembershipId", "RequestId" },
                principalTable: "LeaveRequests",
                principalColumns: new[] { "CompanyId", "MembershipId", "Id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Leaves_LeaveRequests_CompanyId_MembershipId_RequestId",
                table: "Leaves");

            migrationBuilder.DropTable(
                name: "CoveredLeaveSubmissions");

            migrationBuilder.DropTable(
                name: "LeaveEntitlementPeriods");

            migrationBuilder.DropTable(
                name: "LeaveRequests");

            migrationBuilder.DropTable(
                name: "PublicHolidays");

            migrationBuilder.DropIndex(
                name: "IX_Leaves_CompanyId_MembershipId_RequestId",
                table: "Leaves");

            migrationBuilder.DropIndex(
                name: "IX_Leaves_CompanyId_MembershipId_StartDate",
                table: "Leaves");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Leaves_RequestDate",
                table: "Leaves");

            migrationBuilder.DropColumn(
                name: "CountryCode",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "TimeZone",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "EntitlementYear",
                table: "Leaves");

            migrationBuilder.DropColumn(
                name: "LeaveTypeId",
                table: "Leaves");

            migrationBuilder.DropColumn(
                name: "RequestId",
                table: "Leaves");
        }
    }
}

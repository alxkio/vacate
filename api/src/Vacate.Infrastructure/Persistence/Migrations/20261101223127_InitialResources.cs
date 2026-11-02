using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vacate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialResources : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence<int>(
                name: "DepartmentIds");

            migrationBuilder.CreateSequence<int>(
                name: "JobRoleIds");

            migrationBuilder.CreateSequence<int>(
                name: "MembershipIds");

            migrationBuilder.CreateSequence<int>(
                name: "OrganizationIds");

            migrationBuilder.CreateSequence<int>(
                name: "TeamIds");

            migrationBuilder.CreateSequence<int>(
                name: "UserIds");

            migrationBuilder.CreateSequence<int>(
                name: "WorkScheduleIds");

            migrationBuilder.CreateTable(
                name: "Organizations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    WorkWeekDays = table.Column<int>(type: "int", nullable: false),
                    RequireVacationApproval = table.Column<bool>(type: "bit", nullable: false),
                    DepartmentLeadSettingsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    TeamLeadSettingsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    CarryoverEnabled = table.Column<bool>(type: "bit", nullable: false),
                    CarryoverYears = table.Column<int>(type: "int", nullable: false),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeleteRequestedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organizations", x => x.Id);
                    table.CheckConstraint("CK_Organizations_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_Organizations_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
                    table.CheckConstraint("CK_Organizations_Settings", "[WorkWeekDays] IN (5, 6) AND [CarryoverYears] >= 0 AND LEN([Name]) > 0");
                    table.CheckConstraint("CK_Organizations_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
                });

            migrationBuilder.CreateTable(
                name: "SystemRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeleteRequestedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemRoles", x => x.Id);
                    table.CheckConstraint("CK_SystemRoles_Fixed", "([Id] = 1 AND [Name] = N'admin') OR ([Id] = 2 AND [Name] = N'employee')");
                    table.CheckConstraint("CK_SystemRoles_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_SystemRoles_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
                    table.CheckConstraint("CK_SystemRoles_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_BIN2"),
                    FirstName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    MiddleName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Gender = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false, collation: "Latin1_General_100_BIN2"),
                    Status = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false, collation: "Latin1_General_100_BIN2"),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeleteRequestedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.CheckConstraint("CK_Users_Gender", "[Gender] IN (N'woman', N'man', N'unspecified')");
                    table.CheckConstraint("CK_Users_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_Users_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
                    table.CheckConstraint("CK_Users_Name", "LEN([FirstName]) > 0 AND LEN([LastName]) > 0");
                    table.CheckConstraint("CK_Users_Status", "[Status] IN (N'active', N'disabled')");
                    table.CheckConstraint("CK_Users_Username", "LEN([Username]) > 0 AND [Username] = LTRIM(RTRIM([Username]))");
                    table.CheckConstraint("CK_Users_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
                });

            migrationBuilder.CreateTable(
                name: "WorkSchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeleteRequestedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkSchedules", x => x.Id);
                    table.CheckConstraint("CK_WorkSchedules_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_WorkSchedules_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
                    table.CheckConstraint("CK_WorkSchedules_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RequireVacationApproval = table.Column<bool>(type: "bit", nullable: true),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeleteRequestedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                    table.UniqueConstraint("AK_Departments_CompanyId_Id", x => new { x.CompanyId, x.Id });
                    table.CheckConstraint("CK_Departments_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_Departments_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
                    table.CheckConstraint("CK_Departments_Name", "LEN([Name]) > 0");
                    table.CheckConstraint("CK_Departments_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
                    table.ForeignKey(
                        name: "FK_Departments_Organizations_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Organizations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "JobRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeleteRequestedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobRoles", x => x.Id);
                    table.UniqueConstraint("AK_JobRoles_CompanyId_Id", x => new { x.CompanyId, x.Id });
                    table.CheckConstraint("CK_JobRoles_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_JobRoles_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
                    table.CheckConstraint("CK_JobRoles_Name", "LEN([Name]) > 0");
                    table.CheckConstraint("CK_JobRoles_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
                    table.ForeignKey(
                        name: "FK_JobRoles_Organizations_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Organizations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DevelopmentProvisioningAccess",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Invited = table.Column<bool>(type: "bit", nullable: false),
                    CanProvision = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DevelopmentProvisioningAccess", x => new { x.UserId, x.CompanyId });
                    table.ForeignKey(
                        name: "FK_DevelopmentProvisioningAccess_Organizations_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Organizations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DevelopmentProvisioningAccess_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserPrivateProfiles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Married = table.Column<bool>(type: "bit", nullable: false),
                    DependentChildren = table.Column<int>(type: "int", nullable: false),
                    SoleCare = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPrivateProfiles", x => x.UserId);
                    table.CheckConstraint("CK_Private_Family", "[DependentChildren] >= 0 AND NOT ([Married] = 1 AND [SoleCare] = 1)");
                    table.ForeignKey(
                        name: "FK_UserPrivateProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Teams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RequireVacationApproval = table.Column<bool>(type: "bit", nullable: true),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeleteRequestedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teams", x => x.Id);
                    table.UniqueConstraint("AK_Teams_CompanyId_Id", x => new { x.CompanyId, x.Id });
                    table.CheckConstraint("CK_Teams_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_Teams_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
                    table.CheckConstraint("CK_Teams_Name", "LEN([Name]) > 0");
                    table.CheckConstraint("CK_Teams_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
                    table.ForeignKey(
                        name: "FK_Teams_Departments_CompanyId_DepartmentId",
                        columns: x => new { x.CompanyId, x.DepartmentId },
                        principalTable: "Departments",
                        principalColumns: new[] { "CompanyId", "Id" });
                    table.ForeignKey(
                        name: "FK_Teams_Organizations_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Organizations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Memberships",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    SystemRoleId = table.Column<int>(type: "int", nullable: false),
                    JobRoleId = table.Column<int>(type: "int", nullable: false),
                    SettingsRole = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false, collation: "Latin1_General_100_BIN2"),
                    DepartmentId = table.Column<int>(type: "int", nullable: true),
                    TeamId = table.Column<int>(type: "int", nullable: true),
                    ManagerUserId = table.Column<int>(type: "int", nullable: true),
                    HireDate = table.Column<DateOnly>(type: "date", nullable: true),
                    EmploymentEndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    PriorServiceYears = table.Column<decimal>(type: "decimal(18,8)", precision: 18, scale: 8, nullable: true),
                    WorkScheduleId = table.Column<int>(type: "int", nullable: true),
                    HolidayCalendarId = table.Column<int>(type: "int", nullable: true),
                    LeavePolicyId = table.Column<int>(type: "int", nullable: true),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeleteRequestedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Memberships", x => x.Id);
                    table.UniqueConstraint("AK_Memberships_CompanyId_Id", x => new { x.CompanyId, x.Id });
                    table.CheckConstraint("CK_Memberships_Dates", "[HireDate] IS NULL OR [EmploymentEndDate] IS NULL OR [EmploymentEndDate] >= [HireDate]");
                    table.CheckConstraint("CK_Memberships_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_Memberships_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
                    table.CheckConstraint("CK_Memberships_Service", "[PriorServiceYears] IS NULL OR [PriorServiceYears] >= 0");
                    table.CheckConstraint("CK_Memberships_SettingsRole", "[SettingsRole] IN (N'Employee', N'TeamLead', N'DepartmentLead', N'Owner', N'Hr') AND ([SettingsRole] NOT IN (N'Owner', N'Hr') OR [SystemRoleId] = 1)");
                    table.CheckConstraint("CK_Memberships_UnconfiguredPolicy", "[HolidayCalendarId] IS NULL AND [LeavePolicyId] IS NULL");
                    table.CheckConstraint("CK_Memberships_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
                    table.ForeignKey(
                        name: "FK_Memberships_Departments_CompanyId_DepartmentId",
                        columns: x => new { x.CompanyId, x.DepartmentId },
                        principalTable: "Departments",
                        principalColumns: new[] { "CompanyId", "Id" });
                    table.ForeignKey(
                        name: "FK_Memberships_JobRoles_CompanyId_JobRoleId",
                        columns: x => new { x.CompanyId, x.JobRoleId },
                        principalTable: "JobRoles",
                        principalColumns: new[] { "CompanyId", "Id" });
                    table.ForeignKey(
                        name: "FK_Memberships_Organizations_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Organizations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Memberships_SystemRoles_SystemRoleId",
                        column: x => x.SystemRoleId,
                        principalTable: "SystemRoles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Memberships_Teams_CompanyId_TeamId",
                        columns: x => new { x.CompanyId, x.TeamId },
                        principalTable: "Teams",
                        principalColumns: new[] { "CompanyId", "Id" });
                    table.ForeignKey(
                        name: "FK_Memberships_Users_ManagerUserId",
                        column: x => x.ManagerUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Memberships_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Memberships_WorkSchedules_WorkScheduleId",
                        column: x => x.WorkScheduleId,
                        principalTable: "WorkSchedules",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MembershipBalanceSnapshots",
                columns: table => new
                {
                    MembershipId = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    PeriodStart = table.Column<DateOnly>(type: "date", nullable: false),
                    PeriodEnd = table.Column<DateOnly>(type: "date", nullable: false),
                    AsOf = table.Column<DateOnly>(type: "date", nullable: false),
                    PolicyVersion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    PolicyMinimum = table.Column<decimal>(type: "decimal(12,4)", precision: 12, scale: 4, nullable: true),
                    CustomAllocation = table.Column<decimal>(type: "decimal(12,4)", precision: 12, scale: 4, nullable: true),
                    Used = table.Column<decimal>(type: "decimal(12,4)", precision: 12, scale: 4, nullable: false),
                    Pending = table.Column<decimal>(type: "decimal(12,4)", precision: 12, scale: 4, nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MembershipBalanceSnapshots", x => x.MembershipId);
                    table.CheckConstraint("CK_Balance_Period", "[PeriodEnd] >= [PeriodStart]");
                    table.CheckConstraint("CK_Balance_Quantity", "[Used] >= 0 AND [Pending] >= 0 AND ([PolicyMinimum] IS NULL OR [PolicyMinimum] >= 0) AND ([CustomAllocation] IS NULL OR [CustomAllocation] >= COALESCE([PolicyMinimum], 0))");
                    table.ForeignKey(
                        name: "FK_MembershipBalanceSnapshots_Memberships_CompanyId_MembershipId",
                        columns: x => new { x.CompanyId, x.MembershipId },
                        principalTable: "Memberships",
                        principalColumns: new[] { "CompanyId", "Id" });
                });

            migrationBuilder.CreateIndex(
                name: "IX_Departments_Guid",
                table: "Departments",
                column: "Guid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DevelopmentProvisioningAccess_CompanyId",
                table: "DevelopmentProvisioningAccess",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_DevelopmentProvisioningAccess_UserId",
                table: "DevelopmentProvisioningAccess",
                column: "UserId",
                unique: true,
                filter: "[Invited] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_JobRoles_Guid",
                table: "JobRoles",
                column: "Guid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MembershipBalanceSnapshots_CompanyId_MembershipId",
                table: "MembershipBalanceSnapshots",
                columns: new[] { "CompanyId", "MembershipId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_CompanyId_DeletedAt_SystemRoleId",
                table: "Memberships",
                columns: new[] { "CompanyId", "DeletedAt", "SystemRoleId" });

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_CompanyId_DepartmentId",
                table: "Memberships",
                columns: new[] { "CompanyId", "DepartmentId" });

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_CompanyId_JobRoleId",
                table: "Memberships",
                columns: new[] { "CompanyId", "JobRoleId" });

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_CompanyId_ManagerUserId",
                table: "Memberships",
                columns: new[] { "CompanyId", "ManagerUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_CompanyId_TeamId",
                table: "Memberships",
                columns: new[] { "CompanyId", "TeamId" });

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_Guid",
                table: "Memberships",
                column: "Guid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_ManagerUserId",
                table: "Memberships",
                column: "ManagerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_SystemRoleId",
                table: "Memberships",
                column: "SystemRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_UserId",
                table: "Memberships",
                column: "UserId",
                unique: true,
                filter: "[DeletedAt] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_UserId_Id",
                table: "Memberships",
                columns: new[] { "UserId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_WorkScheduleId",
                table: "Memberships",
                column: "WorkScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Guid",
                table: "Organizations",
                column: "Guid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemRoles_Guid",
                table: "SystemRoles",
                column: "Guid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teams_CompanyId_DepartmentId",
                table: "Teams",
                columns: new[] { "CompanyId", "DepartmentId" });

            migrationBuilder.CreateIndex(
                name: "IX_Teams_Guid",
                table: "Teams",
                column: "Guid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Guid",
                table: "Users",
                column: "Guid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkSchedules_Guid",
                table: "WorkSchedules",
                column: "Guid",
                unique: true);
            migrationBuilder.Sql("""
                INSERT INTO [SystemRoles] ([Id], [Guid], [Name], [CreatedAt], [UpdatedAt])
                VALUES (1, '20000000-0000-4000-8000-000000000101', N'admin', SYSUTCDATETIME(), SYSUTCDATETIME()),
                       (2, '20000000-0000-4000-8000-000000000102', N'employee', SYSUTCDATETIME(), SYSUTCDATETIME());
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DevelopmentProvisioningAccess");

            migrationBuilder.DropTable(
                name: "MembershipBalanceSnapshots");

            migrationBuilder.DropTable(
                name: "UserPrivateProfiles");

            migrationBuilder.DropTable(
                name: "Memberships");

            migrationBuilder.DropTable(
                name: "JobRoles");

            migrationBuilder.DropTable(
                name: "SystemRoles");

            migrationBuilder.DropTable(
                name: "Teams");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "WorkSchedules");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "Organizations");

            migrationBuilder.DropSequence(
                name: "DepartmentIds");

            migrationBuilder.DropSequence(
                name: "JobRoleIds");

            migrationBuilder.DropSequence(
                name: "MembershipIds");

            migrationBuilder.DropSequence(
                name: "OrganizationIds");

            migrationBuilder.DropSequence(
                name: "TeamIds");

            migrationBuilder.DropSequence(
                name: "UserIds");

            migrationBuilder.DropSequence(
                name: "WorkScheduleIds");
        }
    }
}

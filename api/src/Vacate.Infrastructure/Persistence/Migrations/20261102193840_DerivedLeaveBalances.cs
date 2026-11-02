using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vacate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DerivedLeaveBalances : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing aggregates contain no occurrence dates. Only known fictional amounts can become openings.
            migrationBuilder.Sql("""
                DECLARE @lockResult int;
                EXEC @lockResult = sys.sp_getapplock @Resource=N'vacate:resource-use-cases', @LockMode=N'Exclusive', @LockOwner=N'Transaction', @LockTimeout=15000;
                IF @lockResult < 0 THROW 51000, 'Resource lock unavailable.', 1;
                IF EXISTS (
                    SELECT 1 FROM dbo.MembershipBalanceSnapshots b
                    JOIN dbo.Memberships m ON m.Id=b.MembershipId AND m.CompanyId=b.CompanyId
                    JOIN dbo.Users u ON u.Id=m.UserId
                    JOIN dbo.Organizations o ON o.Id=m.CompanyId
                    WHERE (b.Used > 0 OR b.Pending > 0) AND NOT EXISTS (
                        SELECT 1 FROM (VALUES
                    ('20000000-0000-4000-8000-000000000600', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000100', 3, 0, '2026-01-01', '2026-12-31'),
                    ('20000000-0000-4000-8000-000000000601', '20000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000100', 4, 0, '2026-01-01', '2026-12-31'),
                    ('20000000-0000-4000-8000-000000000602', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000100', 5, 0, '2026-01-01', '2026-12-31'),
                    ('20000000-0000-4000-8000-000000000603', '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000100', 8, 3, '2026-01-01', '2026-12-31'),
                    ('20000000-0000-4000-8000-000000000604', '20000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000100', 7, 0, '2026-01-01', '2026-12-31'),
                    ('20000000-0000-4000-8000-000000000605', '20000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000100', 3, 0, '2026-01-01', '2026-12-31'),
                    ('20000000-0000-4000-8000-000000000606', '20000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000100', 4, 0, '2026-01-01', '2026-12-31'),
                    ('20000000-0000-4000-8000-000000000607', '20000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000100', 5, 0, '2026-01-01', '2026-12-31'),
                    ('20000000-0000-4000-8000-000000000608', '20000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000100', 6, 0, '2026-01-01', '2026-12-31'),
                    ('20000000-0000-4000-8000-000000000609', '20000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000100', 7, 0, '2026-01-01', '2026-12-31'),
                    ('20000000-0000-4000-8000-000000000610', '20000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000100', 1, 2, '2026-01-01', '2026-12-31'),
                    ('20000000-0000-4000-8000-000000000611', '20000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000100', 4, 0, '2026-01-01', '2026-12-31')
                        ) f(MemberGuid, UserGuid, CompanyGuid, Used, Pending, PeriodStart, PeriodEnd)
                        WHERE m.Guid=CONVERT(uniqueidentifier,f.MemberGuid) AND u.Guid=CONVERT(uniqueidentifier,f.UserGuid)
                        AND o.Guid=CONVERT(uniqueidentifier,f.CompanyGuid) AND o.IsDemo=1
                        AND b.Used=f.Used AND b.Pending=f.Pending
                        AND b.PeriodStart=CONVERT(date,f.PeriodStart) AND b.PeriodEnd=CONVERT(date,f.PeriodEnd)))
                    THROW 51000, 'Unrecognized nonzero consumption: reviewed provenance/import required; snapshots preserved.', 1;
                """);

            migrationBuilder.CreateTable(
                name: "MembershipEntitlements",
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
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MembershipEntitlements", x => x.MembershipId);
                    table.UniqueConstraint("AK_MembershipEntitlements_CompanyId_MembershipId", x => new { x.CompanyId, x.MembershipId });
                    table.CheckConstraint("CK_Entitlement_Allocation", "([PolicyMinimum] IS NULL OR [PolicyMinimum] >= 0) AND ([CustomAllocation] IS NULL OR [CustomAllocation] >= COALESCE([PolicyMinimum], 0))");
                    table.CheckConstraint("CK_Entitlement_Period", "[PeriodEnd] >= [PeriodStart]");
                    table.ForeignKey(
                        name: "FK_MembershipEntitlements_Memberships_CompanyId_MembershipId",
                        columns: x => new { x.CompanyId, x.MembershipId },
                        principalTable: "Memberships",
                        principalColumns: new[] { "CompanyId", "Id" });
                });

            migrationBuilder.CreateTable(
                name: "Leaves",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    MembershipId = table.Column<int>(type: "int", nullable: false),
                    EntryKind = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false, collation: "Latin1_General_100_BIN2"),
                    Status = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false, collation: "Latin1_General_100_BIN2"),
                    QuantityDays = table.Column<decimal>(type: "decimal(12,4)", precision: 12, scale: 4, nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Source = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leaves", x => x.Id);
                    table.CheckConstraint("CK_Leaves_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_Leaves_Origin", "LEN([Source]) > 0 AND (([EntryKind] = N'ImportedOpening' AND [Status] IN (N'Used', N'Pending') AND [StartDate] IS NULL AND [EndDate] IS NULL) OR ([EntryKind] = N'RecordedLeave' AND [Status] IN (N'Used', N'Pending', N'Cancelled') AND [StartDate] IS NOT NULL AND [EndDate] IS NOT NULL AND [EndDate] >= [StartDate]))");
                    table.CheckConstraint("CK_Leaves_Quantity", "[QuantityDays] > 0");
                    table.CheckConstraint("CK_Leaves_Utc", "[UpdatedAt] >= [CreatedAt] AND DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0");
                    table.ForeignKey(
                        name: "FK_Leaves_MembershipEntitlements_CompanyId_MembershipId",
                        columns: x => new { x.CompanyId, x.MembershipId },
                        principalTable: "MembershipEntitlements",
                        principalColumns: new[] { "CompanyId", "MembershipId" });
                    table.ForeignKey(
                        name: "FK_Leaves_Memberships_CompanyId_MembershipId",
                        columns: x => new { x.CompanyId, x.MembershipId },
                        principalTable: "Memberships",
                        principalColumns: new[] { "CompanyId", "Id" });
                });

            migrationBuilder.CreateIndex(
                name: "IX_Leaves_Guid", table: "Leaves", column: "Guid", unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Leaves_CompanyId_MembershipId_EntryKind_Status",
                table: "Leaves",
                columns: new[] { "CompanyId", "MembershipId", "EntryKind", "Status" },
                unique: true,
                filter: "[EntryKind] = N'ImportedOpening'");

            migrationBuilder.CreateIndex(
                name: "IX_Leaves_CompanyId_MembershipId_Status",
                table: "Leaves",
                columns: new[] { "CompanyId", "MembershipId", "Status" });
            migrationBuilder.Sql("""
                INSERT dbo.MembershipEntitlements (MembershipId,CompanyId,PeriodStart,PeriodEnd,AsOf,PolicyVersion,PolicyMinimum,CustomAllocation)
                SELECT MembershipId,CompanyId,PeriodStart,PeriodEnd,AsOf,PolicyVersion,PolicyMinimum,CustomAllocation
                FROM dbo.MembershipBalanceSnapshots;

                INSERT dbo.Leaves (Guid,CompanyId,MembershipId,EntryKind,Status,QuantityDays,StartDate,EndDate,Source,CreatedAt,UpdatedAt)
                SELECT NEWID(),b.CompanyId,b.MembershipId,N'ImportedOpening',v.Status,v.Quantity,NULL,NULL,
                    N'fictional-fixture-opening-v1',m.CreatedAt,m.UpdatedAt
                FROM dbo.MembershipBalanceSnapshots b
                JOIN dbo.Memberships m ON m.CompanyId=b.CompanyId AND m.Id=b.MembershipId
                CROSS APPLY (VALUES (N'Used',b.Used),(N'Pending',b.Pending)) v(Status,Quantity)
                WHERE v.Quantity > 0;

                IF (SELECT COUNT_BIG(*) FROM dbo.MembershipEntitlements) <> (SELECT COUNT_BIG(*) FROM dbo.MembershipBalanceSnapshots)
                    THROW 51000, 'Entitlement migration count mismatch; transaction rolled back.', 1;
                IF EXISTS (
                    SELECT 1 FROM dbo.MembershipBalanceSnapshots b
                    WHERE b.Used <> COALESCE((SELECT SUM(l.QuantityDays) FROM dbo.Leaves l WHERE l.CompanyId=b.CompanyId AND l.MembershipId=b.MembershipId AND l.Status=N'Used'),0)
                    OR b.Pending <> COALESCE((SELECT SUM(l.QuantityDays) FROM dbo.Leaves l WHERE l.CompanyId=b.CompanyId AND l.MembershipId=b.MembershipId AND l.Status=N'Pending'),0))
                    THROW 51000, 'Leave migration total mismatch; transaction rolled back.', 1;
                """);

            migrationBuilder.DropTable(name: "MembershipBalanceSnapshots");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new NotSupportedException("Derived leave records cannot be downgraded into stored consumption totals. Use a reviewed forward migration.");
        }
    }
}

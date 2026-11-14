using Microsoft.EntityFrameworkCore.Migrations;

namespace Vacate.Infrastructure.Persistence.Migrations;

public partial class LeaveCancellationExpiry : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropCheckConstraint("CK_Leaves_Origin", "Leaves");
        migrationBuilder.AddCheckConstraint("CK_Leaves_Origin", "Leaves", "LEN([Source]) > 0 AND (([EntryKind] = N'ImportedOpening' AND [Status] IN (N'Used', N'Pending') AND [StartDate] IS NULL AND [EndDate] IS NULL) OR ([EntryKind] = N'RecordedLeave' AND [Status] IN (N'Used', N'Pending', N'Cancelled', N'Withdrawn', N'Expired') AND [StartDate] IS NOT NULL AND [EndDate] IS NOT NULL AND [EndDate] >= [StartDate]))");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // A rollback cannot silently turn cancellations or expiry into approved leave.
        migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM dbo.Leaves WHERE Status IN (N'Withdrawn', N'Expired')) THROW 51000, 'Cancellation and expiry history prevents downgrade.', 1;");
        migrationBuilder.DropCheckConstraint("CK_Leaves_Origin", "Leaves");
        migrationBuilder.AddCheckConstraint("CK_Leaves_Origin", "Leaves", "LEN([Source]) > 0 AND (([EntryKind] = N'ImportedOpening' AND [Status] IN (N'Used', N'Pending') AND [StartDate] IS NULL AND [EndDate] IS NULL) OR ([EntryKind] = N'RecordedLeave' AND [Status] IN (N'Used', N'Pending', N'Cancelled') AND [StartDate] IS NOT NULL AND [EndDate] IS NOT NULL AND [EndDate] >= [StartDate]))");
    }
}

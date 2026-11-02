using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage;
using Vacate.Infrastructure.Persistence;

namespace Vacate.Database;

// Explicit pre-cutover acceptance: execute the actual forward script, always rolling back.
internal static class DerivedMigrationVerification
{
    private const string Previous = "20261101230540_OrganizationDemoMarker";
    private const string Replacement = "20261102193840_DerivedLeaveBalances";

    public static void Run(VacateDbContext context)
    {
        var applied = context.Database.GetAppliedMigrations().ToArray();
        if (!applied.Contains(Previous) || applied.Contains(Replacement))
        {
            throw new InvalidOperationException("Verify this replacement only against its reviewed pre-cutover baseline.");
        }

        var script = context.GetService<IMigrator>().GenerateScript(Previous, Replacement);
        context.Database.OpenConnection();
        using (var transaction = context.Database.BeginTransaction())
        {
            var changed = context.Database.ExecuteSqlRaw("""
                UPDATE dbo.MembershipBalanceSnapshots SET Used=Used+0.5
                WHERE MembershipId=(SELECT MIN(MembershipId) FROM dbo.MembershipBalanceSnapshots);
                """);
            if (changed != 1)
            {
                throw new InvalidOperationException("Negative migration verification requires a fictional baseline row.");
            }

            var rejected = false;
            try
            {
                ExecuteBatches(context, script);
            }
            catch (SqlException error) when (error.Number == 51000 && error.Message.Contains("Unrecognized nonzero consumption", StringComparison.Ordinal))
            {
                rejected = true;
            }

            transaction.Rollback();
            if (!rejected)
            {
                throw new InvalidOperationException("Migration failed to reject unrecognized consumption.");
            }
        }

        using (var transaction = context.Database.BeginTransaction())
        {
            ExecuteBatches(context, script);
            var result = context.Database.SqlQueryRaw<int>("""
                SELECT CASE WHEN OBJECT_ID(N'dbo.MembershipBalanceSnapshots',N'U') IS NULL
                    AND OBJECT_ID(N'dbo.MembershipEntitlements',N'U') IS NOT NULL
                    AND OBJECT_ID(N'dbo.Leaves',N'U') IS NOT NULL THEN 1 ELSE 0 END AS [Value]
                """).Single();
            if (result != 1)
            {
                throw new InvalidOperationException("Replacement tables were not produced by the migration.");
            }

            transaction.Rollback();
        }

        if (context.Database.GetAppliedMigrations().Contains(Replacement))
        {
            throw new InvalidOperationException("Verification unexpectedly persisted migration history.");
        }

        Console.WriteLine("PASS: actual forward script rejects unknown nonzero consumption, preserves exact fixture sums and replaces tables; both acceptance transactions rolled back.");
    }

    private static void ExecuteBatches(VacateDbContext context, string script)
    {
        foreach (var batch in Regex.Split(script, @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(batch))
            {
                continue;
            }

            using var command = context.Database.GetDbConnection().CreateCommand();
            command.Transaction = context.Database.CurrentTransaction!.GetDbTransaction();
            command.CommandText = batch;
            command.ExecuteNonQuery();
        }
    }
}

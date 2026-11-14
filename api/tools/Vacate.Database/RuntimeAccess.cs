using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Vacate.Infrastructure.Persistence;

namespace Vacate.Database;

internal static partial class RuntimeAccess
{
    public static void Grant(VacateDbContext context, string name, string clientIdText)
    {
        ValidatePrincipal(name, clientIdText);
        var clientId = Guid.Parse(clientIdText);

        // CREATE USER WITH SID/TYPE uses the managed identity client ID, per current Azure SQL documentation.
        var sid = Convert.ToHexString(clientId.ToByteArray());
        context.Database.OpenConnection();
        using var transaction = context.Database.BeginTransaction();
        Execute(context, $"""
            IF EXISTS (SELECT 1 FROM sys.database_principals WHERE [name] = N'{name}' AND ([sid] <> 0x{sid} OR [type] <> 'E'))
                THROW 51000, 'Existing database principal does not match the resolved managed identity.', 1;
            IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE [name] = N'{name}')
                CREATE USER [{name}] WITH SID = 0x{sid}, TYPE = E;
            IF DATABASE_PRINCIPAL_ID(N'vacate_resource_runtime') IS NULL
                CREATE ROLE [vacate_resource_runtime] AUTHORIZATION [dbo];
            """);

        // Physical deletion is limited to personal leave requests/dates and credential tickets; other resources remain operator-only.
        foreach (var table in new[] { "Users", "UserPrivateProfiles", "Organizations", "Departments", "Teams", "Memberships", "MembershipEntitlements", "JobRoles", "DevelopmentProvisioningAccess", "CompanyHolidays", "CompanyClosures", "CompanyClosureResults", "CompanyApproverAssignments" })
        {
            Execute(context, $"GRANT SELECT, INSERT, UPDATE ON OBJECT::[dbo].[{table}] TO [vacate_resource_runtime]");
        }

        foreach (var table in new[] { "SystemRoles", "WorkSchedules", "LeaveEntitlementPeriods", "PublicHolidays", "DevelopmentLogins" })
        {
            Execute(context, $"GRANT SELECT ON OBJECT::[dbo].[{table}] TO [vacate_resource_runtime]");
        }

        foreach (var table in new[] { "Leaves", "LeaveRequests", "CoveredLeaveSubmissions" })
        {
            Execute(context, $"GRANT SELECT, INSERT ON OBJECT::[dbo].[{table}] TO [vacate_resource_runtime]");
        }

        foreach (var table in new[] { "Leaves", "LeaveRequests" })
        {
            Execute(context, $"GRANT UPDATE, DELETE ON OBJECT::[dbo].[{table}] TO [vacate_resource_runtime]");
        }

        Execute(context, "GRANT SELECT, INSERT, DELETE ON OBJECT::[dbo].[ApiSessions] TO [vacate_resource_runtime]");

        foreach (var sequence in new[] { "UserIds", "MembershipIds", "OrganizationIds", "DepartmentIds", "TeamIds", "JobRoleIds", "CompanyHolidayIds", "CompanyClosureIds", "CompanyApproverIds" })
        {
            Execute(context, $"GRANT UPDATE ON OBJECT::[dbo].[{sequence}] TO [vacate_resource_runtime]");
        }

        Execute(context, $"IF IS_ROLEMEMBER(N'vacate_resource_runtime', N'{name}') = 0 ALTER ROLE [vacate_resource_runtime] ADD MEMBER [{name}]");
        using var command = context.Database.GetDbConnection().CreateCommand();
        command.Transaction = context.Database.CurrentTransaction!.GetDbTransaction();
        var administrativeTables = new[] { "CompanyHolidays", "CompanyClosures", "CompanyClosureResults", "CompanyApproverAssignments" };
        var administrativeSequences = new[] { "CompanyHolidayIds", "CompanyClosureIds", "CompanyApproverIds" };
        var checks = administrativeTables.SelectMany(table => new[] { "SELECT", "INSERT", "UPDATE" }
                .Select(permission => $"IF COALESCE(HAS_PERMS_BY_NAME(N'dbo.{table}', N'OBJECT', N'{permission}'), 0) <> 1 THROW 51000, 'Company administration runtime permission missing.', 1;"))
            .Concat(administrativeTables.Select(table => $"IF COALESCE(HAS_PERMS_BY_NAME(N'dbo.{table}', N'OBJECT', N'DELETE'), 0) <> 0 THROW 51000, 'Company administration DELETE permission is forbidden.', 1;"))
            .Concat(administrativeSequences.Select(sequence => $"IF COALESCE(HAS_PERMS_BY_NAME(N'dbo.{sequence}', N'OBJECT', N'UPDATE'), 0) <> 1 THROW 51000, 'Company administration sequence permission missing.', 1;"));
        command.CommandText = $"""
            EXECUTE AS USER = N'{name}';
            BEGIN TRY
            {string.Join("\n", checks)}
            IF COALESCE(HAS_PERMS_BY_NAME(N'dbo.ApiSessions', N'OBJECT', N'SELECT'), 0) <> 1
                OR COALESCE(HAS_PERMS_BY_NAME(N'dbo.ApiSessions', N'OBJECT', N'INSERT'), 0) <> 1
                OR COALESCE(HAS_PERMS_BY_NAME(N'dbo.ApiSessions', N'OBJECT', N'DELETE'), 0) <> 1
                OR COALESCE(HAS_PERMS_BY_NAME(N'dbo.ApiSessions', N'OBJECT', N'UPDATE'), 0) <> 0
                THROW 51000, 'Shared session runtime permission boundary failed.', 1;
            IF COALESCE(HAS_PERMS_BY_NAME(N'dbo.LeaveRequests', N'OBJECT', N'DELETE'), 0) <> 1
                THROW 51000, 'Personal request deletion runtime permission missing.', 1;
            IF COALESCE(HAS_PERMS_BY_NAME(N'dbo.CoveredLeaveSubmissions', N'OBJECT', N'DELETE'), 0) <> 0
                THROW 51000, 'Covered receipt DELETE permission is forbidden.', 1;
            IF COALESCE(HAS_PERMS_BY_NAME(N'dbo.LeaveRequests', N'OBJECT', N'UPDATE'), 0) <> 1
                THROW 51000, 'Leave decision runtime permission missing.', 1;
            SELECT IS_MEMBER(N'db_owner'), HAS_PERMS_BY_NAME(DB_NAME(), N'DATABASE', N'CREATE TABLE'),
                HAS_PERMS_BY_NAME(N'dbo.Organizations', N'OBJECT', N'UPDATE'),
                HAS_PERMS_BY_NAME(N'dbo.Users', N'OBJECT', N'DELETE'),
                COALESCE(HAS_PERMS_BY_NAME(N'dbo.__EFMigrationsHistory', N'OBJECT', N'UPDATE'), 0),
                HAS_PERMS_BY_NAME(N'dbo.Leaves', N'OBJECT', N'SELECT'),
                HAS_PERMS_BY_NAME(N'dbo.Leaves', N'OBJECT', N'INSERT'),
                HAS_PERMS_BY_NAME(N'dbo.Leaves', N'OBJECT', N'UPDATE'),
                HAS_PERMS_BY_NAME(N'dbo.Leaves', N'OBJECT', N'DELETE'),
                HAS_PERMS_BY_NAME(N'dbo.LeaveRequests', N'OBJECT', N'INSERT'),
                HAS_PERMS_BY_NAME(N'dbo.CoveredLeaveSubmissions', N'OBJECT', N'INSERT'),
                HAS_PERMS_BY_NAME(N'dbo.LeaveEntitlementPeriods', N'OBJECT', N'SELECT'),
                HAS_PERMS_BY_NAME(N'dbo.PublicHolidays', N'OBJECT', N'SELECT');
            REVERT;
            END TRY
            BEGIN CATCH
                REVERT;
                THROW;
            END CATCH;
            """;
        using (var reader = command.ExecuteReader())
        {
            if (!reader.Read() || reader.GetInt32(0) != 0 || reader.GetInt32(1) != 0 || reader.GetInt32(2) != 1
                || reader.GetInt32(3) != 0 || reader.GetInt32(4) != 0 || reader.GetInt32(5) != 1
                || reader.GetInt32(6) != 1 || reader.GetInt32(7) != 1 || reader.GetInt32(8) != 1
                || reader.GetInt32(9) != 1 || reader.GetInt32(10) != 1 || reader.GetInt32(11) != 1 || reader.GetInt32(12) != 1)
            {
                throw new InvalidOperationException("Runtime permission boundary failed; grants rolled back.");
            }
        }

        transaction.Commit();
        Console.WriteLine("Resolved Entra principal granted resource DML/sequence access; db_owner, DDL and migration writes denied; personal request/leave deletion, assigned decisions and shared session access permitted.");
    }

    private static void Execute(VacateDbContext context, string sql)
    {
        // Principal identifiers pass the strict name/GUID checks above; object names are fixed allowlists.
        using var command = context.Database.GetDbConnection().CreateCommand();
        command.Transaction = context.Database.CurrentTransaction!.GetDbTransaction();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    internal static void ValidatePrincipal(string name, string clientIdText)
    {
        if (!PrincipalName().IsMatch(name) || !Guid.TryParse(clientIdText, out var clientId) || clientId == Guid.Empty)
        {
            throw new ArgumentException("Use the resolved managed identity name and client ID.");
        }
    }

    [GeneratedRegex("^[A-Za-z0-9-]{1,128}$")]
    private static partial Regex PrincipalName();
}

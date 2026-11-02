using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Vacate.Infrastructure.Persistence;

namespace Vacate.Database;

internal static partial class RuntimeAccess
{
    public static void Grant(VacateDbContext context, string name, string clientIdText)
    {
        if (!PrincipalName().IsMatch(name) || !Guid.TryParse(clientIdText, out var clientId) || clientId == Guid.Empty)
        {
            throw new ArgumentException("Use the resolved managed identity name and client ID.");
        }

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

        // Allow current resource operations only; schema management and physical deletion stay with the operator.
        foreach (var table in new[] { "Users", "UserPrivateProfiles", "Organizations", "Departments", "Teams", "Memberships", "MembershipEntitlements", "JobRoles", "DevelopmentProvisioningAccess" })
        {
            Execute(context, $"GRANT SELECT, INSERT, UPDATE ON OBJECT::[dbo].[{table}] TO [vacate_resource_runtime]");
        }

        foreach (var table in new[] { "SystemRoles", "WorkSchedules", "Leaves" })
        {
            Execute(context, $"GRANT SELECT ON OBJECT::[dbo].[{table}] TO [vacate_resource_runtime]");
        }

        foreach (var sequence in new[] { "UserIds", "MembershipIds", "OrganizationIds", "DepartmentIds", "TeamIds", "JobRoleIds" })
        {
            Execute(context, $"GRANT UPDATE ON OBJECT::[dbo].[{sequence}] TO [vacate_resource_runtime]");
        }

        Execute(context, $"ALTER ROLE [vacate_resource_runtime] ADD MEMBER [{name}]");
        using var command = context.Database.GetDbConnection().CreateCommand();
        command.Transaction = context.Database.CurrentTransaction!.GetDbTransaction();
        command.CommandText = $"""
            EXECUTE AS USER = N'{name}';
            SELECT IS_MEMBER(N'db_owner'), HAS_PERMS_BY_NAME(DB_NAME(), N'DATABASE', N'CREATE TABLE'),
                HAS_PERMS_BY_NAME(N'dbo.Organizations', N'OBJECT', N'UPDATE'),
                HAS_PERMS_BY_NAME(N'dbo.Users', N'OBJECT', N'DELETE'),
                COALESCE(HAS_PERMS_BY_NAME(N'dbo.__EFMigrationsHistory', N'OBJECT', N'UPDATE'), 0),
                HAS_PERMS_BY_NAME(N'dbo.Leaves', N'OBJECT', N'SELECT'),
                HAS_PERMS_BY_NAME(N'dbo.Leaves', N'OBJECT', N'INSERT'),
                HAS_PERMS_BY_NAME(N'dbo.Leaves', N'OBJECT', N'UPDATE'),
                HAS_PERMS_BY_NAME(N'dbo.Leaves', N'OBJECT', N'DELETE');
            REVERT;
            """;
        using (var reader = command.ExecuteReader())
        {
            if (!reader.Read() || reader.GetInt32(0) != 0 || reader.GetInt32(1) != 0 || reader.GetInt32(2) != 1
                || reader.GetInt32(3) != 0 || reader.GetInt32(4) != 0 || reader.GetInt32(5) != 1
                || reader.GetInt32(6) != 0 || reader.GetInt32(7) != 0 || reader.GetInt32(8) != 0)
            {
                throw new InvalidOperationException("Runtime permission boundary failed; grants rolled back.");
            }
        }

        transaction.Commit();
        Console.WriteLine("Resolved Entra principal granted resource DML/sequence access; db_owner, DDL, DELETE and migration writes and Leaves INSERT/UPDATE/DELETE denied.");
    }

    private static void Execute(VacateDbContext context, string sql)
    {
        // Principal identifiers pass the strict name/GUID checks above; object names are fixed allowlists.
        using var command = context.Database.GetDbConnection().CreateCommand();
        command.Transaction = context.Database.CurrentTransaction!.GetDbTransaction();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    [GeneratedRegex("^[A-Za-z0-9-]{1,128}$")]
    private static partial Regex PrincipalName();
}

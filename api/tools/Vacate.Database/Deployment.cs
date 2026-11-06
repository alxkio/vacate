using System.Reflection;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Vacate.Infrastructure.Persistence;

namespace Vacate.Database;

internal static class Deployment
{
    internal static void Validate(string connection, string runtimeName, string runtimeClientId)
    {
        RuntimeAccess.ValidatePrincipal(runtimeName, runtimeClientId);
        ValidateConnection(connection, Required("VACATE_SQL_SERVER"), Required("VACATE_SQL_DATABASE"), runtimeClientId);
        var revision = Required("VACATE_DEPLOY_REVISION");
        var version = typeof(Deployment).Assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()!.InformationalVersion;
        ValidateRevision(version, revision);
    }

    internal static void ValidateRevision(string version, string revision)
    {
        if (string.IsNullOrWhiteSpace(revision) || !version.EndsWith("+" + revision, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Database artifact revision differs from the application release.");
        }
    }

    internal static void ValidateConnection(string connection, string server, string database, string runtimeClientId)
    {
        var sql = new SqlConnectionStringBuilder(connection);
        if (!string.Equals(sql.DataSource, $"tcp:{server},1433", StringComparison.OrdinalIgnoreCase)
            || !string.Equals(sql.InitialCatalog, database, StringComparison.Ordinal)
            || sql.Encrypt == SqlConnectionEncryptOption.Optional || sql.TrustServerCertificate
            || sql.Authentication != SqlAuthenticationMethod.ActiveDirectoryServicePrincipal
            || !Guid.TryParse(sql.UserID, out var migrationClientId) || migrationClientId == Guid.Empty
            || migrationClientId == Guid.Parse(runtimeClientId) || string.IsNullOrWhiteSpace(sql.Password))
        {
            throw new InvalidOperationException("Use the designated SQL target with verified TLS and a separate Entra migration service principal.");
        }
    }

    internal static void Migrate(VacateDbContext context)
    {
        var applied = context.Database.GetAppliedMigrations().ToArray();
        var known = context.Database.GetMigrations().ToHashSet();
        if (applied.Any(id => !known.Contains(id)))
        {
            throw new InvalidOperationException("Database migration history is not owned by this application; use a compatible release or a forward correction.");
        }

        if (applied.Length == 0 && context.Database.SqlQueryRaw<int>(
            "SELECT COUNT(*) AS [Value] FROM sys.tables WHERE is_ms_shipped = 0 AND [name] <> N'__EFMigrationsHistory'").Single() != 0)
        {
            throw new InvalidOperationException("The baseline requires an empty database; existing data was preserved.");
        }

        context.Database.Migrate();
        Console.WriteLine("Reviewed forward migrations applied (no change when already current).");
    }

    internal static void Verify(VacateDbContext context, string runtimeName)
    {
        if (context.Database.GetPendingMigrations().Any())
        {
            throw new InvalidOperationException("Required migrations remain pending; application publication blocked.");
        }

        // Compile every mapped column under the runtime identity, without reading business records.
        // The principal name has passed RuntimeAccess's strict identifier allowlist.
        context.Database.OpenConnection();
        using var command = context.Database.GetDbConnection().CreateCommand();
        var reads = context.Model.GetEntityTypes().Select(entity =>
        {
            var table = Microsoft.EntityFrameworkCore.Metadata.StoreObjectIdentifier.Table(entity.GetTableName()!, entity.GetSchema());
            var columns = string.Join(", ", entity.GetProperties().Select(p => Quote(p.GetColumnName(table)!)));
            return $"SELECT TOP (0) {columns} FROM {Quote(entity.GetSchema() ?? "dbo")}.{Quote(entity.GetTableName()!)};";
        });
        command.CommandText = $"EXECUTE AS USER = N'{runtimeName}'; BEGIN TRY {string.Join("\n", reads)} REVERT; END TRY BEGIN CATCH REVERT; THROW; END CATCH;";
        command.ExecuteNonQuery();
        Console.WriteLine($"Verified migration {context.Database.GetMigrations().Last()} and runtime access to all mapped columns.");
    }

    private static string Quote(string identifier) => "[" + identifier.Replace("]", "]]", StringComparison.Ordinal) + "]";

    private static string Required(string name) => Environment.GetEnvironmentVariable(name) is { Length: > 0 } value
        ? value : throw new InvalidOperationException($"Set {name} explicitly for database deployment.");
}

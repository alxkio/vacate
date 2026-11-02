using Microsoft.EntityFrameworkCore;
using Vacate.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Vacate.Infrastructure.Persistence;
using Vacate.Infrastructure.Persistence.Sql;

var operation = args.FirstOrDefault() ?? "script";
var connection = Environment.GetEnvironmentVariable("VACATE_SQL_CONNECTION")
    ?? "Server=localhost;Database=Vacate;Integrated Security=true;Encrypt=true;TrustServerCertificate=false";
using var context = new VacateDbContext(new DbContextOptionsBuilder<VacateDbContext>().UseSqlServer(connection).Options);
if (operation == "script")
{
    Console.WriteLine(context.GetService<IMigrator>().GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent));
}
else if (operation == "inspect" && Environment.GetEnvironmentVariable("VACATE_SQL_CONNECTION") is not null)
{
    context.Database.OpenConnection();
    using var command = context.Database.GetDbConnection().CreateCommand();
    command.CommandText = "SELECT t.name, SUM(p.rows) FROM sys.tables t JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1) WHERE t.is_ms_shipped = 0 GROUP BY t.name ORDER BY t.name";
    using var reader = command.ExecuteReader();
    while (reader.Read())
    {
        Console.WriteLine($"{reader.GetString(0)}: {reader.GetInt64(1)} rows");
    }

    reader.Close();
    using var demoCommand = context.Database.GetDbConnection().CreateCommand();
    demoCommand.CommandText = "IF COL_LENGTH(N'dbo.Organizations', N'IsDemo') IS NOT NULL EXEC(N'SELECT IsDemo, COUNT_BIG(*) FROM dbo.Organizations GROUP BY IsDemo')";
    using var demoReader = demoCommand.ExecuteReader();
    while (demoReader.Read())
    {
        Console.WriteLine($"Organizations.IsDemo={demoReader.GetBoolean(0)}: {demoReader.GetInt64(1)} rows");
    }
}
else if (operation == "verify-derived-migration" && Environment.GetEnvironmentVariable("VACATE_SQL_CONNECTION") is not null)
{
    DerivedMigrationVerification.Run(context);
}
else if (operation == "migrate" && Environment.GetEnvironmentVariable("VACATE_SQL_CONNECTION") is not null)
{
    var applied = context.Database.GetAppliedMigrations().ToArray();
    var known = context.Database.GetMigrations().ToHashSet();
    if (applied.Any(id => !known.Contains(id)))
    {
        throw new InvalidOperationException("Database migration history is not owned by this application.");
    }

    if (applied.Length == 0 && context.Database.SqlQueryRaw<int>(
        "SELECT COUNT(*) AS [Value] FROM sys.tables WHERE is_ms_shipped = 0 AND [name] <> N'__EFMigrationsHistory'").Single() != 0)
    {
        throw new InvalidOperationException("The baseline requires an empty database; existing data was preserved.");
    }

    context.Database.Migrate();
    Console.WriteLine("Reviewed forward migrations applied.");
}
else if (operation == "grant-runtime" && args.Length == 3 && Environment.GetEnvironmentVariable("VACATE_SQL_CONNECTION") is not null)
{
    RuntimeAccess.Grant(context, args[1], args[2]);
}
else if (operation == "seed-fictional" && args.Contains("--empty-only") && Environment.GetEnvironmentVariable("VACATE_SQL_CONNECTION") is not null)
{
    SqlDevelopmentSeeder.Import(context);
    Console.WriteLine("Fictional fixtures imported into empty resource tables; no existing data overwritten.");
}
else
{
    throw new ArgumentException("Use script, inspect, migrate, verify-derived-migration, grant-runtime NAME CLIENT_ID, or seed-fictional --empty-only with VACATE_SQL_CONNECTION. No downgrade or automatic seed is supported.");
}

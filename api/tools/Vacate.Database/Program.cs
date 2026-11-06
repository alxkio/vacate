using Microsoft.EntityFrameworkCore;
using Vacate.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Vacate.Infrastructure.Persistence;
using Vacate.Infrastructure.Persistence.Sql;

var operation = args.FirstOrDefault() ?? "script";
var connection = Environment.GetEnvironmentVariable("VACATE_SQL_CONNECTION")
    ?? "Server=localhost;Database=Vacate;Integrated Security=true;Encrypt=true;TrustServerCertificate=false";
if (operation == "deploy")
{
    if (args.Length != 3)
    {
        throw new ArgumentException("Use deploy RUNTIME_NAME RUNTIME_CLIENT_ID with the explicit deployment target environment variables.");
    }

    Deployment.Validate(connection, args[1], args[2]);
}

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
else if (operation == "deploy")
{
    Deployment.Migrate(context);
    RuntimeAccess.Grant(context, args[1], args[2]);
    Deployment.Verify(context, args[1]);
}
else if (operation == "migrate" && Environment.GetEnvironmentVariable("VACATE_SQL_CONNECTION") is not null)
{
    Deployment.Migrate(context);
}
else if (operation == "configure-leave-entitlement" && args.Length == 6 && Environment.GetEnvironmentVariable("VACATE_SQL_CONNECTION") is not null)
{
    var organizationGuid = Guid.Parse(args[1]);
    var membershipGuid = Guid.Parse(args[2]);
    var type = args[3];
    var year = int.Parse(args[4], System.Globalization.CultureInfo.InvariantCulture);
    var allocation = decimal.Parse(args[5], System.Globalization.CultureInfo.InvariantCulture);
    if (type.Length is < 1 or > 80 || type.Any(c => !(char.IsAsciiLetterLower(c) || c == '-'))
        || year is < 1 or > 9999 || allocation < 0 || allocation >= 100000000m || decimal.Round(allocation, 4) != allocation)
    {
        throw new ArgumentException("Use a lowercase leave type, calendar year and nonnegative finite allocation with at most four decimals.");
    }

    using var transaction = context.Database.BeginTransaction();
    context.Database.ExecuteSqlRaw("DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=N'vacate:resource-use-cases', @LockMode=N'Exclusive', @LockOwner=N'Transaction'; IF @r<0 THROW 51000,'Resource lock unavailable.',1;");
    var organization = context.Set<OrganizationRow>().Single(x => x.Guid == organizationGuid && x.DeletedAt == null);
    var member = context.Set<MembershipRow>().Single(x => x.Guid == membershipGuid && x.CompanyId == organization.Id && x.DeletedAt == null);
    if (context.Set<LeaveEntitlementRow>().Any(x => x.CompanyId == organization.Id && x.MembershipId == member.Id && x.LeaveTypeId == type && x.Year == year))
    {
        throw new InvalidOperationException("A configured period already exists; this insert-only tool does not rewrite entitlement history.");
    }

    var current = context.Set<MembershipEntitlementRow>().Single(x => x.CompanyId == organization.Id && x.MembershipId == member.Id);
    if (type == "annual" && current.PeriodStart.Year == year)
    {
        throw new InvalidOperationException("Configure the existing current annual allocation through membership settings; this tool creates other explicit periods only.");
    }

    context.Add(new LeaveEntitlementRow { CompanyId = organization.Id, MembershipId = member.Id, LeaveTypeId = type, Year = year, Allocation = allocation });
    context.SaveChanges();
    transaction.Commit();
    Console.WriteLine("Explicit finite entitlement period created; no statutory quota was calculated.");
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
    throw new ArgumentException("Use script, inspect, migrate, deploy RUNTIME_NAME RUNTIME_CLIENT_ID, verify-derived-migration, configure-leave-entitlement ORGANIZATION_GUID MEMBERSHIP_GUID TYPE YEAR ALLOCATION, grant-runtime NAME CLIENT_ID, or seed-fictional --empty-only with VACATE_SQL_CONNECTION. No downgrade or automatic seed is supported.");
}

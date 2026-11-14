using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Vacate.Application.Abstractions;
using Vacate.Infrastructure;
using Vacate.Infrastructure.Identity;
using Vacate.Infrastructure.Persistence;
using Vacate.Infrastructure.Persistence.Sql;

namespace Vacate.IntegrationTests;

public sealed class SessionStoreTests
{
    [Test]
    public void SQL_persistence_selects_a_scoped_shared_store_without_an_inmemory_session_fallback()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Persistence:Provider"] = "SqlServer",
            ["ConnectionStrings:Vacate"] = "Server=localhost;Database=OfflineModelOnly;Integrated Security=true;Encrypt=true;TrustServerCertificate=false"
        }).Build();
        var services = new ServiceCollection().AddSingleton<IConfiguration>(configuration).AddPersistence(configuration);
        var registration = services.Where(descriptor => descriptor.ServiceType == typeof(ISessionStore)).ToArray();
        Assert.That(registration, Has.Length.EqualTo(1));
        Assert.That(registration[0].ImplementationType, Is.EqualTo(typeof(SqlSessionStore)));
        Assert.That(registration[0].Lifetime, Is.EqualTo(ServiceLifetime.Scoped));
        using var provider = services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
        using var first = provider.CreateScope();
        using var second = provider.CreateScope();
        Assert.That(first.ServiceProvider.GetRequiredService<ISessionStore>(), Is.TypeOf<SqlSessionStore>());
        Assert.That(second.ServiceProvider.GetRequiredService<ISessionStore>(), Is.Not.SameAs(first.ServiceProvider.GetRequiredService<ISessionStore>()));
    }

    [Test]
    public void Inmemory_persistence_keeps_the_explicit_process_local_store()
    {
        var configuration = new ConfigurationBuilder().Build();
        var services = new ServiceCollection().AddSingleton<IConfiguration>(configuration).AddInMemoryPersistence();
        var registration = services.Single(descriptor => descriptor.ServiceType == typeof(ISessionStore));
        Assert.That(registration.ImplementationType, Is.EqualTo(typeof(InMemorySessionStore)));
        Assert.That(registration.Lifetime, Is.EqualTo(ServiceLifetime.Singleton));
    }

    [Test]
    public void Session_model_and_incremental_migration_store_only_hashes_with_utc_expiry_and_a_global_user_identity()
    {
        using var context = new VacateDbContext(new DbContextOptionsBuilder<VacateDbContext>()
            .UseSqlServer("Server=localhost;Database=OfflineModelOnly;Integrated Security=true;Encrypt=true;TrustServerCertificate=false").Options);
        var entity = context.Model.FindEntityType(typeof(SessionRow))!;
        Assert.That(entity.GetTableName(), Is.EqualTo("ApiSessions"));
        Assert.That(entity.GetProperties().Select(property => property.Name), Is.EquivalentTo(new[] { "TokenHash", "UserId", "CreatedAt", "ExpiresAt" }));
        Assert.That(entity.FindPrimaryKey()!.Properties.Select(property => property.Name), Is.EqualTo(new[] { "TokenHash" }));
        Assert.That(entity.FindProperty("TokenHash")!.GetColumnType(), Is.EqualTo("char(64)"));
        var userKey = entity.GetForeignKeys().Single();
        Assert.That(userKey.PrincipalEntityType.ClrType, Is.EqualTo(typeof(UserRow)));
        Assert.That(userKey.Properties.Select(property => property.Name), Is.EqualTo(new[] { "UserId" }));
        Assert.That(userKey.DeleteBehavior, Is.EqualTo(DeleteBehavior.NoAction));
        Assert.That(entity.GetIndexes().Select(index => string.Join(",", index.Properties.Select(property => property.Name))), Is.EquivalentTo(new[] { "UserId", "ExpiresAt" }));

        var migration = context.Database.GetMigrations().Single(name => name.EndsWith("_SharedApiSessions"));
        Assert.That(migration, Does.EndWith("_SharedApiSessions"));
        var script = context.GetService<IMigrator>().GenerateScript("20261112210758_CompanyAdministration", migration, MigrationsSqlGenerationOptions.Idempotent);
        Assert.That(script, Does.Contain("CREATE TABLE [ApiSessions]"));
        Assert.That(script, Does.Contain("[TokenHash] char(64) COLLATE Latin1_General_100_BIN2"));
        Assert.That(script, Does.Contain("FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])"));
        Assert.That(script, Does.Contain("[ExpiresAt] > [CreatedAt]").And.Contain("DATEPART(TZOFFSET, [CreatedAt]) = 0").And.Contain("DATEPART(TZOFFSET, [ExpiresAt]) = 0"));
        Assert.That(script, Does.Not.Contain("[AccessToken]").And.Not.Contain("[CompanyId]").And.Not.Match(@"(?im)^\s*(DROP|DELETE|TRUNCATE)\s"));
        var root = new DirectoryInfo(TestContext.CurrentContext.TestDirectory);
        while (root is not null && !File.Exists(Path.Combine(root.FullName, "AGENTS.md")))
        {
            root = root.Parent;
        }

        Assert.That(root, Is.Not.Null, "Find the repository root to compare the reviewed SQL artifact.");
        var artifact = File.ReadAllText(Path.Combine(root!.FullName, "docs/database/migrations/0005-shared-api-sessions.sql"));
        Assert.That(artifact.Replace("\r\n", "\n").Trim(), Is.EqualTo(script.Replace("\r\n", "\n").Trim()));
    }
}

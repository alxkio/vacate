using Microsoft.Data.SqlClient;
using Vacate.Database;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Vacate.Application.Abstractions;
using Vacate.Infrastructure;
using Vacate.Infrastructure.Persistence;

namespace Vacate.IntegrationTests;

public sealed class DatabaseDeploymentTests
{
    private const string Server = "vacate-dev-srv.database.windows.net";
    private const string Database = "vacate-dev-db";
    private const string RuntimeClient = "10000000-0000-4000-8000-000000000001";
    private const string MigrationClient = "10000000-0000-4000-8000-000000000002";

    private static SqlConnectionStringBuilder Connection() => new()
    {
        DataSource = $"tcp:{Server},1433",
        InitialCatalog = Database,
        Authentication = SqlAuthenticationMethod.ActiveDirectoryServicePrincipal,
        UserID = MigrationClient,
        Password = "synthetic-test-secret",
        Encrypt = SqlConnectionEncryptOption.Mandatory,
        TrustServerCertificate = false
    };

    [Test]
    public void Ordinary_inmemory_hosting_has_no_fixture_accounts_even_with_retired_seed_setting()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["SeedData:Enabled"] = "true",
            ["TestFixtures:Enabled"] = "true",
            ["DevelopmentAuthentication:Enabled"] = "true"
        }).Build();
        using var provider = new ServiceCollection().AddSingleton<IConfiguration>(configuration)
            .AddPersistence(configuration).BuildServiceProvider();
        Assert.That(provider.GetRequiredService<IUserRepository>().All(), Is.Empty);
        var credentials = provider.GetRequiredService<ICredentialValidator>();
        Assert.That(credentials.Enabled, Is.False);
        Assert.That(credentials.Accounts(), Is.Empty);
        Assert.That(credentials.Validate("maya", "maya"), Is.Null);
        foreach (var assembly in new[] { typeof(InMemoryDatabase).Assembly, typeof(Vacate.Api.Functions.SessionFunctions).Assembly })
        {
            Assert.That(assembly.GetManifestResourceNames().Any(name => name.Contains("fictional-users")), Is.False);
            Assert.That(assembly.GetTypes().Any(type => type.Namespace == "Vacate.Testing"), Is.False);
        }
    }

    [Test]
    public void SQL_startup_does_not_load_fixtures_and_disabled_test_login_never_queries_accounts()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Persistence:Provider"] = "SqlServer",
            ["ConnectionStrings:Vacate"] = Connection().ConnectionString,
            ["SeedData:Enabled"] = "true",
            ["DevelopmentAuthentication:Enabled"] = "false"
        }).Build();
        var services = new ServiceCollection().AddSingleton<IConfiguration>(configuration).AddPersistence(configuration);
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        Assert.That(scope.ServiceProvider.GetService<InMemoryDatabase>(), Is.Null);
        var credentials = scope.ServiceProvider.GetRequiredService<ICredentialValidator>();
        Assert.That(credentials.Validate("anything", "anything"), Is.Null);
        Assert.That(credentials.Accounts(), Is.Empty);
    }

    [Test]
    public void Operator_assembly_must_match_the_application_release_revision()
    {
        Assert.DoesNotThrow(() => Deployment.ValidateRevision("1.0.0+release-sha", "release-sha"));
    }

    [TestCase("old-release-sha")]
    [TestCase("")]
    [TestCase("sha")]
    public void Stale_or_unversioned_operator_is_rejected(string revision)
    {
        Assert.Throws<InvalidOperationException>(() => Deployment.ValidateRevision("1.0.0+release-sha", revision));
    }

    [Test]
    public void Explicit_encrypted_target_with_separate_migration_identity_is_accepted_without_connecting()
    {
        Assert.DoesNotThrow(() => Deployment.ValidateConnection(Connection().ConnectionString, Server, Database, RuntimeClient));
    }

    [TestCase("server")]
    [TestCase("database")]
    [TestCase("encryption")]
    [TestCase("certificate")]
    [TestCase("runtime-identity")]
    [TestCase("sql-password")]
    [TestCase("missing-secret")]
    public void Wrong_target_or_unsafe_identity_is_rejected_before_database_access(string change)
    {
        var sql = Connection();
        switch (change)
        {
            case "server":
                sql.DataSource = "tcp:another-server.database.windows.net,1433";
                break;
            case "database":
                sql.InitialCatalog = "another-environment";
                break;
            case "encryption":
                sql.Encrypt = SqlConnectionEncryptOption.Optional;
                break;
            case "certificate":
                sql.TrustServerCertificate = true;
                break;
            case "runtime-identity":
                sql.UserID = RuntimeClient;
                break;
            case "sql-password":
                sql.Authentication = SqlAuthenticationMethod.SqlPassword;
                break;
            case "missing-secret":
                sql.Password = "";
                break;
        }

        Assert.Throws<InvalidOperationException>(() => Deployment.ValidateConnection(sql.ConnectionString, Server, Database, RuntimeClient));
    }

    [TestCase("runtime-user'; DROP TABLE Users; --")]
    [TestCase("runtime[user]")]
    public void Runtime_principal_cannot_inject_sql(string name)
    {
        Assert.Throws<ArgumentException>(() => RuntimeAccess.ValidatePrincipal(name, RuntimeClient));
    }
}

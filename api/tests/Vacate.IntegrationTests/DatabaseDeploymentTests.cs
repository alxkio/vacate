using Microsoft.Data.SqlClient;
using Vacate.Database;

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

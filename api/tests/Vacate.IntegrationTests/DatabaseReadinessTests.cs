using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Vacate.Database;
using Vacate.Infrastructure.Persistence;

namespace Vacate.IntegrationTests;

public sealed class DatabaseReadinessTests
{
    private const string Connection = "Server=tcp:example.invalid,1433;Database=readiness-test;Encrypt=True;TrustServerCertificate=False";

    [Test]
    public void Transient_probe_failure_recovers_within_the_retry_budget()
    {
        using var probe = DatabaseReadiness.CreateProbe(Connection, TimeSpan.Zero);
        var attempts = 0;
        var result = probe.Database.CreateExecutionStrategy().Execute(() =>
        {
            attempts++;
            if (attempts < 3)
            {
                throw new TimeoutException("Synthetic transient readiness failure.");
            }

            return 1;
        });

        Assert.Multiple(() =>
        {
            Assert.That(attempts, Is.EqualTo(3));
            Assert.That(result, Is.EqualTo(1));
        });
    }

    [Test]
    public void Persistent_unavailability_exhausts_a_finite_retry_budget()
    {
        using var probe = DatabaseReadiness.CreateProbe(Connection, TimeSpan.Zero);
        var attempts = 0;
        Assert.Throws<RetryLimitExceededException>(() =>
        {
            probe.Database.CreateExecutionStrategy().Execute(() =>
            {
                attempts++;
                throw new TimeoutException("Synthetic persistent unavailability.");
            });
        });

        Assert.That(attempts, Is.EqualTo(DatabaseReadiness.MaxRetryCount + 1));
    }

    [Test]
    public void Permanent_probe_failure_is_not_retried()
    {
        using var probe = DatabaseReadiness.CreateProbe(Connection, TimeSpan.Zero);
        var attempts = 0;
        Assert.Throws<InvalidOperationException>(() => probe.Database.CreateExecutionStrategy().Execute(() =>
        {
            attempts++;
            throw new InvalidOperationException("Synthetic permanent configuration failure.");
        }));
        Assert.That(attempts, Is.EqualTo(1));
    }

    [Test]
    public void Readiness_retry_configuration_does_not_enable_write_transaction_replays()
    {
        using var probe = DatabaseReadiness.CreateProbe(Connection, TimeSpan.Zero);
        using var writer = new VacateDbContext(new DbContextOptionsBuilder<VacateDbContext>().UseSqlServer(Connection).Options);
        Assert.Multiple(() =>
        {
            Assert.That(probe.Database.CreateExecutionStrategy().RetriesOnFailure, Is.True);
            Assert.That(writer.Database.CreateExecutionStrategy().RetriesOnFailure, Is.False);
            Assert.That(probe.Database.GetCommandTimeout(), Is.EqualTo(15));
            Assert.That(probe.Database.GetDbConnection().ConnectionTimeout, Is.EqualTo(15));
        });
    }
}

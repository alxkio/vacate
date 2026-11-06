using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage;

namespace Vacate.Database;

internal static class DatabaseReadiness
{
    internal const int MaxRetryCount = 8;

    internal static void Wait(string connection)
    {
        Console.WriteLine("Checking SQL availability before migration (read-only; up to eight transient retries).");
        using var probe = CreateProbe(connection);
        try
        {
            _ = probe.Database.SqlQueryRaw<int>("SELECT 1 AS [Value]").Single();
        }
        catch (RetryLimitExceededException error)
        {
            throw new InvalidOperationException("SQL remained unavailable after the bounded readiness retries; migration and runtime grants were not started. Check database availability and free-limit/AutoPause status before retrying deployment.", error);
        }

        Console.WriteLine("SQL availability verified; proceeding to migration history checks.");
    }

    internal static DbContext CreateProbe(string connection, TimeSpan? maxRetryDelay = null)
    {
        var sql = new SqlConnectionStringBuilder(connection)
        {
            ConnectTimeout = 15,
            ConnectRetryCount = 0
        };
        // Retry only this read-only probe. The operator's explicit write transactions keep their existing strategy.
        var options = new DbContextOptionsBuilder()
            .UseSqlServer(sql.ConnectionString, provider =>
            {
                provider.CommandTimeout(15);
                // SqlClient reports login/connection timeouts as -2; replay is safe for this constant read only.
                provider.EnableRetryOnFailure(MaxRetryCount, maxRetryDelay ?? TimeSpan.FromSeconds(15), [40613, -2]);
            })
            .LogTo(_ => Console.WriteLine("Transient SQL availability failure; retrying the read-only readiness check."), [CoreEventId.ExecutionStrategyRetrying])
            .Options;
        return new DbContext(options);
    }
}

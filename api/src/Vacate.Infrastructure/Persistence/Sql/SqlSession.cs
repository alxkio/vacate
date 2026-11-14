using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Vacate.Application.Abstractions;
using Vacate.Domain.Common;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;

namespace Vacate.Infrastructure.Persistence.Sql;

internal sealed class SqlSession(VacateDbContext context, TimeProvider? clock = null) : IUnitOfWork
{
    private readonly Dictionary<int, (User Value, UserRow Row)> users = [];
    private readonly Dictionary<int, (Membership Value, MembershipRow Row)> members = [];
    private readonly Dictionary<int, (Organization Value, OrganizationRow Row)> organizations = [];
    private readonly HashSet<int> companies = [];
    private bool active;

    public VacateDbContext Context => active ? context : throw new InvalidOperationException("Use a SQL unit of work.");
    public IEnumerable<User> TrackedUsers => users.Values.Select(x => x.Value);
    public IEnumerable<Membership> TrackedMemberships => members.Values.Select(x => x.Value);
    public IEnumerable<Organization> TrackedOrganizations => organizations.Values.Select(x => x.Value);

    public T Execute<T>(Func<T> operation)
    {
        if (active)
        {
            return operation();
        }

        using var transaction = context.Database.BeginTransaction(IsolationLevel.ReadCommitted);
        active = true;
        try
        {
            // Current ports may traverse several aggregates before their tenant is known.
            // This admission lock prevents cross-row write skew and lock-order deadlocks.
            Lock("vacate:resource-use-cases");
            var result = operation();
            foreach (var pair in users.Values)
            {
                RowMapper.Write(pair.Value, pair.Row);
            }

            foreach (var pair in organizations.Values)
            {
                RowMapper.Write(pair.Value, pair.Row);
            }

            foreach (var pair in members.Values)
            {
                RowMapper.Write(pair.Value, pair.Row);
            }

            context.SaveChanges();
            transaction.Commit();
            return result;
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new DomainConflictException("The resource changed. Reload and try again.");
        }
        catch (DbUpdateException error) when (error.InnerException is SqlException sql && sql.Number is 2601 or 2627 or 547)
        {
            throw new DomainConflictException("The resource conflicts with an existing identity or relationship.");
        }
        catch (SqlException error) when (error.Number is 1205 or 1222 or 51000)
        {
            throw new DomainConflictException("The resource is busy. Reload and try again.");
        }
        finally
        {
            // Also discard failed mutations: objects never escape into another request's identity map.
            context.ChangeTracker.Clear();
            users.Clear();
            members.Clear();
            organizations.Clear();
            companies.Clear();
            active = false;
        }
    }

    public void Company(int id)
    {
        if (companies.Add(id))
        {
            Lock($"vacate:company:{id}");
            var zone = Context.Set<OrganizationRow>().Where(o => o.Id == id).Select(o => o.TimeZone).SingleOrDefault();
            if (zone is not null)
            {
                var now = (clock ?? TimeProvider.System).GetUtcNow();
                var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, TimeZoneInfo.FindSystemTimeZoneById(zone)).DateTime);
                var expired = Context.Set<LeaveRow>().Where(d => d.CompanyId == id && d.Status == "Pending" && d.StartDate < today).ToArray();
                foreach (var date in expired)
                {
                    date.Status = "Expired";
                    date.UpdatedAt = now;
                }

                var requestIds = expired.Select(d => d.RequestId).ToArray();
                foreach (var request in Context.Set<LeaveRequestRow>().Where(r => r.CompanyId == id && requestIds.Contains(r.Id)))
                {
                    request.UpdatedAt = now;
                }

                Context.SaveChanges();
            }
        }
    }

    public int Next(string sequence)
    {
        if (!ResourceModel.Sequences.Contains(sequence))
        {
            throw new ArgumentException("Unknown sequence.", nameof(sequence));
        }

        using var command = Context.Database.GetDbConnection().CreateCommand();
        command.Transaction = Context.Database.CurrentTransaction!.GetDbTransaction();
        command.CommandText = $"SELECT NEXT VALUE FOR [dbo].[{sequence}]";
        return Convert.ToInt32(command.ExecuteScalar());
    }

    public User Track(UserRow row)
    {
        if (!users.TryGetValue(row.Id, out var pair))
        {
            pair = (RowMapper.Read(row), row);
            users.Add(row.Id, pair);
        }

        return pair.Value;
    }

    public Membership Track(MembershipRow row)
    {
        Company(row.CompanyId);
        if (!members.TryGetValue(row.Id, out var pair))
        {
            pair = (RowMapper.Read(row), row);
            members.Add(row.Id, pair);
        }

        return pair.Value;
    }

    public Organization Track(OrganizationRow row)
    {
        Company(row.Id);
        if (!organizations.TryGetValue(row.Id, out var pair))
        {
            pair = (RowMapper.Read(row), row);
            organizations.Add(row.Id, pair);
        }

        return pair.Value;
    }

    public void Add(User value)
    {
        var row = new UserRow();
        RowMapper.Write(value, row);
        Context.Add(row);
        users.Add(value.Id, (value, row));
    }

    public void Add(Membership value)
    {
        Company(value.CompanyId);
        if (value.Balance.Used != 0 || value.Balance.Pending != 0)
        {
            throw new DomainValidationException("Consumption must come from leave records, not membership totals.");
        }

        var row = new MembershipRow();
        RowMapper.Write(value, row);
        Context.Add(row);
        members.Add(value.Id, (value, row));
    }

    public void Add(Organization value)
    {
        Company(value.Id);
        var row = new OrganizationRow();
        RowMapper.Write(value, row);
        Context.Add(row);
        organizations.Add(value.Id, (value, row));
    }

    private void Lock(string resource)
    {
        Context.Database.ExecuteSqlInterpolated($"""
            DECLARE @result int;
            EXEC @result = sys.sp_getapplock @Resource={resource}, @LockMode=N'Exclusive',
                @LockOwner=N'Transaction', @LockTimeout=15000;
            IF @result < 0 THROW 51000, 'Resource lock unavailable.', 1;
            """);
    }
}

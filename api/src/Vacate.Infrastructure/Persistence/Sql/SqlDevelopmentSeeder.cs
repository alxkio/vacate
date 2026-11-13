using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Vacate.Domain.Common;

namespace Vacate.Infrastructure.Persistence.Sql;

// Explicit operator/test import, never a host-startup seed and never a real-data migration.
public static class SqlDevelopmentSeeder
{
    public static void Import(VacateDbContext context)
    {
        using var transaction = context.Database.BeginTransaction();
        context.Database.ExecuteSqlRaw("""
            DECLARE @result int;
            EXEC @result = sys.sp_getapplock @Resource=N'vacate:resource-use-cases', @LockMode=N'Exclusive', @LockOwner=N'Transaction', @LockTimeout=15000;
            IF @result < 0 THROW 51000, 'Resource lock unavailable.', 1;
            """);
        // Never reset, merge or silently overwrite existing user data on a repeat import.
        if (context.Set<UserRow>().Any() || context.Set<OrganizationRow>().Any()
            || context.Set<JobRoleRow>().Any() || context.Set<WorkScheduleRow>().Any())
        {
            throw new DomainConflictException("Fictional import requires empty resource tables. Existing data was preserved.");
        }

        var fixture = new InMemoryDatabase(true);
        foreach (var organization in fixture.Organizations.Values)
        {
            var row = new OrganizationRow();
            RowMapper.Write(organization, row);
            row.IsDemo = true;
            context.Add(row);
        }

        var now = DateTimeOffset.UtcNow;
        foreach (var role in fixture.JobRoles)
        {
            context.Add(new JobRoleRow { Id = role.Id, Guid = role.Guid, Name = role.Name, CompanyId = role.CompanyId!.Value, CreatedAt = now, UpdatedAt = now });
        }

        foreach (var schedule in fixture.WorkSchedules)
        {
            context.Add(new WorkScheduleRow { Id = schedule.Id, Guid = schedule.Guid, Name = schedule.Name, CreatedAt = now, UpdatedAt = now });
        }

        foreach (var user in fixture.Users.Values)
        {
            var row = new UserRow();
            RowMapper.Write(user, row);
            context.Add(row);
        }

        foreach (var membership in fixture.Memberships)
        {
            var row = new MembershipRow();
            RowMapper.Write(membership, row);
            foreach (var (status, quantity) in new[] { ("Used", membership.Balance.Used), ("Pending", membership.Balance.Pending) })
            {
                if (quantity > 0)
                {
                    row.Leaves.Add(new LeaveRow
                    {
                        Guid = Guid.NewGuid(), CompanyId = membership.CompanyId, MembershipId = membership.Id,
                        EntryKind = "ImportedOpening", Status = status, QuantityDays = quantity,
                        Source = "fictional-fixture-opening-v1", CreatedAt = membership.CreatedAt, UpdatedAt = membership.UpdatedAt
                    });
                }
            }

            context.Add(row);
        }

        foreach (var (userId, companyId) in fixture.Invitations)
        {
            context.Add(new DevelopmentAccessRow { UserId = userId, CompanyId = companyId, Invited = true });
        }

        var assignmentId = 1;
        foreach (var (companyId, calendar) in fixture.CompanyCalendars)
        {
            foreach (var assignment in calendar.Approvers)
            {
                context.Add(new CompanyApproverRow
                {
                    Id = assignmentId++, Guid = Guid.NewGuid(), CompanyId = companyId,
                    Scope = assignment.Scope, ScopeGuid = assignment.ScopeGuid, ApproverGuid = assignment.ApproverGuid,
                    CreatedAt = now, UpdatedAt = now
                });
            }
        }

        context.SaveChanges();
        Restart(context, "UserIds", fixture.Users.Keys.DefaultIfEmpty(0).Max() + 1);
        Restart(context, "OrganizationIds", fixture.Organizations.Keys.DefaultIfEmpty(0).Max() + 1);
        Restart(context, "MembershipIds", fixture.Memberships.Select(x => x.Id).DefaultIfEmpty(0).Max() + 1);
        Restart(context, "DepartmentIds", fixture.Organizations.Values.SelectMany(x => x.Departments).Select(x => x.Id).DefaultIfEmpty(0).Max() + 1);
        Restart(context, "TeamIds", fixture.Organizations.Values.SelectMany(x => x.Teams).Select(x => x.Id).DefaultIfEmpty(0).Max() + 1);
        Restart(context, "JobRoleIds", fixture.JobRoles.Select(x => x.Id).DefaultIfEmpty(0).Max() + 1);
        Restart(context, "WorkScheduleIds", fixture.WorkSchedules.Select(x => x.Id).DefaultIfEmpty(0).Max() + 1);
        Restart(context, "CompanyApproverIds", assignmentId);
        transaction.Commit();
        context.ChangeTracker.Clear();
    }

    private static void Restart(VacateDbContext context, string sequence, int next)
    {
        if (!ResourceModel.Sequences.Contains(sequence) || next < 1)
        {
            throw new ArgumentException("Invalid seed sequence.");
        }

        // Identifiers are an internal allowlist and the numeric value is validated, never caller SQL.
        var current = context.Database.SqlQueryRaw<long>(
            "SELECT CONVERT(bigint, current_value) AS [Value] FROM sys.sequences WHERE [name] = {0} AND schema_id = SCHEMA_ID(N'dbo')", sequence).Single();
        var resume = Math.Max(current + 1, next);
        if (resume > int.MaxValue)
        {
            throw new DomainConflictException("The ID sequence is exhausted.");
        }

        using var command = context.Database.GetDbConnection().CreateCommand();
        command.Transaction = context.Database.CurrentTransaction!.GetDbTransaction();
        command.CommandText = $"ALTER SEQUENCE [dbo].[{sequence}] RESTART WITH {resume}";
        command.ExecuteNonQuery();
    }
}

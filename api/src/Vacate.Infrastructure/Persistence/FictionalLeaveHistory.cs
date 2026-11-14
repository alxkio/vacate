using System.Security.Cryptography;
using System.Text;
using Vacate.Application.Leave;

namespace Vacate.Infrastructure.Persistence;

// Fixed dates intentionally become historical; these are explicitly fictional, not reconstructed employee facts.
public static class FictionalLeaveHistory
{
    internal static IReadOnlyList<StoredLeaveRequest> Records(InMemoryDatabase fixture)
    {
        return fixture.Memberships.SelectMany(member => new[] { "Approved", "Pending" }.Select(status =>
        {
            var count = status == "Approved" ? Math.Min(2, (int)member.Balance.Used) : (int)member.Balance.Pending;
            var start = status == "Approved" ? new DateOnly(2026, 8, 3) : new DateOnly(2026, 10, 26);
            var dates = Enumerable.Range(0, count).Select(offset => new LeaveDateRecord(start.AddDays(offset), status, 2026)).ToArray();
            var suffix = status == "Pending" ? ":pending" : "";
            var key = new Guid(SHA256.HashData(Encoding.UTF8.GetBytes($"vacate-fictional-history-v1:{member.Guid}{suffix}")).AsSpan(0, 16));
            var created = status == "Approved" ? new DateTimeOffset(2026, 8, 1, 0, 0, 0, TimeSpan.Zero) : new DateTimeOffset(2026, 10, 22, 0, 0, 0, TimeSpan.Zero);
            var approver = status == "Pending" ? fixture.CompanyCalendars.GetValueOrDefault(member.CompanyId)?.Approvers.FirstOrDefault()?.ApproverGuid : null;
            var record = new LeaveRequestRecord(key, "annual", created, dates, approver);
            return new StoredLeaveRequest(member.CompanyId, member.Id, key, "fictional-history-v1", record);
        })).Where(r => r.Request.Dates.Count > 0).ToArray();
    }

    public static void Apply(InMemoryDatabase database)
    {
        var repository = new InMemoryLeaves(database);
        foreach (var record in Records(database))
        {
            if (repository.Find(record.CompanyId, record.Request.Guid) is not null)
            {
                continue;
            }
            if (record.Request.Dates.Any(d => repository.CoveredDates(record.CompanyId, record.MembershipId).Contains(d.Date)))
            {
                continue;
            }
            var member = database.Memberships.Single(m => m.Id == record.MembershipId);
            // Convert known fictional opening consumption to dated examples, without doubling the balance.
            member.AddLeaveConsumption(-record.Request.Dates.Count(d => d.Status == "Approved"), -record.Request.Dates.Count(d => d.Status == "Pending"));
            repository.Add(record);
        }
    }
}

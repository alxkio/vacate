using Vacate.Application.Leave;

namespace Vacate.Infrastructure.Persistence;

public sealed class InMemoryLeaves(InMemoryDatabase database) : ILeaveRepository
{
    public IReadOnlyList<LeaveEntitlement> Entitlements(int companyId, int membershipId) => database.LeaveEntitlements
        .Where(x => x.CompanyId == companyId && x.MembershipId == membershipId)
        .Select(x => x.Entitlement with
        {
            Used = x.Entitlement.Used + Requests(companyId, membershipId).Where(r => r.Request.LeaveTypeId == x.Entitlement.LeaveTypeId)
                .SelectMany(r => r.Request.Dates).Count(d => d.EntitlementYear == x.Entitlement.Year && d.Status == "Approved"),
            Pending = x.Entitlement.Pending + Requests(companyId, membershipId).Where(r => r.Request.LeaveTypeId == x.Entitlement.LeaveTypeId)
                .SelectMany(r => r.Request.Dates).Count(d => d.EntitlementYear == x.Entitlement.Year && d.Status == "Pending")
        }).ToArray();

    public IReadOnlyList<StoredLeaveRequest> Requests(int companyId, int membershipId) => database.LeaveRequests
        .Where(x => x.CompanyId == companyId && x.MembershipId == membershipId).ToArray();

    public IReadOnlySet<DateOnly> CoveredDates(int companyId, int membershipId) => Requests(companyId, membershipId)
        .SelectMany(x => x.Request.Dates).Where(d => d.Status is "Approved" or "Pending").Select(d => d.Date).ToHashSet();

    public IReadOnlySet<DateOnly> Holidays(string? countryCode) => database.PublicHolidays
        .Where(x => x.CountryCode == countryCode).Select(x => x.Date).ToHashSet();

    public IReadOnlySet<int> HolidayYears(string? countryCode) => Holidays(countryCode).Select(x => x.Year).ToHashSet();

    public string? CoveredReceipt(int companyId, int membershipId, Guid key) => database.CoveredReceipts.GetValueOrDefault((companyId, membershipId, key));

    public void AddCoveredReceipt(int companyId, int membershipId, Guid key, string fingerprint) => database.CoveredReceipts.Add((companyId, membershipId, key), fingerprint);

    public void Add(StoredLeaveRequest request)
    {
        database.LeaveRequests.Add(request);
        var member = database.Memberships.Single(m => m.Id == request.MembershipId && m.CompanyId == request.CompanyId);
        if (request.Request.LeaveTypeId == "annual")
        {
            var dates = request.Request.Dates.Where(d => d.EntitlementYear == member.Balance.PeriodStart.Year).ToArray();
            member.AddLeaveConsumption(dates.Count(d => d.Status == "Approved"), dates.Count(d => d.Status == "Pending"));
        }
    }
}

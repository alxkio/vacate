using Microsoft.EntityFrameworkCore;
using Vacate.Application.Leave;

namespace Vacate.Infrastructure.Persistence.Sql;

internal sealed class SqlLeaves(SqlSession session) : ILeaveRepository
{
    public IReadOnlyList<LeaveEntitlement> Entitlements(int companyId, int membershipId)
    {
        var currentYear = session.Context.Set<MembershipEntitlementRow>().Where(x => x.CompanyId == companyId && x.MembershipId == membershipId).Select(x => x.PeriodStart.Year).Single();
        var charges = session.Context.Set<LeaveRow>().Where(x => x.CompanyId == companyId && x.MembershipId == membershipId).ToArray();
        return session.Context.Set<LeaveEntitlementRow>().Where(x => x.CompanyId == companyId && x.MembershipId == membershipId)
            .ToArray().Select(e => new LeaveEntitlement(e.LeaveTypeId, e.Year, e.Allocation,
                charges.Where(c => c.LeaveTypeId == e.LeaveTypeId && (c.EntitlementYear ?? currentYear) == e.Year && c.Status == "Used").Sum(c => c.QuantityDays),
                charges.Where(c => c.LeaveTypeId == e.LeaveTypeId && (c.EntitlementYear ?? currentYear) == e.Year && c.Status == "Pending").Sum(c => c.QuantityDays))).ToArray();
    }

    public IReadOnlyList<StoredLeaveRequest> Requests(int companyId, int membershipId)
    {
        var dates = session.Context.Set<LeaveRow>().Where(x => x.CompanyId == companyId && x.MembershipId == membershipId && x.RequestId != null).ToArray();
        return session.Context.Set<LeaveRequestRow>().Where(x => x.CompanyId == companyId && x.MembershipId == membershipId).ToArray()
            .Select(r => new StoredLeaveRequest(companyId, membershipId, r.IdempotencyKey, r.Fingerprint,
                new(r.Guid, r.LeaveTypeId, r.CreatedAt, dates.Where(d => d.RequestId == r.Id).OrderBy(d => d.StartDate)
                    .Select(d => new LeaveDateRecord(d.StartDate!.Value, d.Status == "Used" ? "Approved" : d.Status, d.EntitlementYear!.Value)).ToArray()))).ToArray();
    }

    public IReadOnlySet<DateOnly> CoveredDates(int companyId, int membershipId)
    {
        var rows = session.Context.Set<LeaveRow>().Where(x => x.CompanyId == companyId && x.MembershipId == membershipId
            && (x.Status == "Used" || x.Status == "Pending") && x.StartDate != null).ToArray();
        return rows.SelectMany(row => Enumerable.Range(0, row.EndDate!.Value.DayNumber - row.StartDate!.Value.DayNumber + 1)
            .Select(offset => row.StartDate.Value.AddDays(offset))).ToHashSet();
    }

    public IReadOnlySet<DateOnly> Holidays(string? countryCode) => session.Context.Set<PublicHolidayRow>()
        .Where(x => x.CountryCode == countryCode).Select(x => x.Date).ToHashSet();

    public IReadOnlySet<int> HolidayYears(string? countryCode) => Holidays(countryCode).Select(x => x.Year).ToHashSet();

    public string? CoveredReceipt(int companyId, int membershipId, Guid key) => session.Context.Set<CoveredSubmissionRow>()
        .Where(x => x.CompanyId == companyId && x.MembershipId == membershipId && x.IdempotencyKey == key).Select(x => x.Fingerprint).SingleOrDefault();

    public void AddCoveredReceipt(int companyId, int membershipId, Guid key, string fingerprint) => session.Context.Add(new CoveredSubmissionRow
    {
        CompanyId = companyId,
        MembershipId = membershipId,
        IdempotencyKey = key,
        Fingerprint = fingerprint
    });

    public void Add(StoredLeaveRequest request)
    {
        var requestRow = new LeaveRequestRow
        {
            Guid = request.Request.Guid,
            CompanyId = request.CompanyId,
            MembershipId = request.MembershipId,
            IdempotencyKey = request.IdempotencyKey,
            Fingerprint = request.Fingerprint,
            LeaveTypeId = request.Request.LeaveTypeId,
            CreatedAt = request.Request.CreatedAt,
            UpdatedAt = request.Request.CreatedAt
        };
        session.Context.Add(requestRow);
        foreach (var date in request.Request.Dates)
        {
            session.Context.Add(new LeaveRow
            {
                Guid = Guid.NewGuid(),
                CompanyId = request.CompanyId,
                MembershipId = request.MembershipId,
                StartDate = date.Date,
                EndDate = date.Date,
                EntitlementYear = date.EntitlementYear,
                Request = requestRow,
                LeaveTypeId = request.Request.LeaveTypeId,
                QuantityDays = 1,
                Status = date.Status == "Approved" ? "Used" : date.Status,
                Source = "EmployeeRequest",
                CreatedAt = request.Request.CreatedAt,
                UpdatedAt = request.Request.CreatedAt
            });
        }
    }
}

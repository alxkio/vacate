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
                    .Select(d => new LeaveDateRecord(d.StartDate!.Value, d.Status == "Used" ? "Approved" : d.Status == "Cancelled" ? "Declined" : d.Status, d.EntitlementYear!.Value)).ToArray(),
                    r.ApproverGuid, r.DecidedAt, r.Source, r.ClosureGuid, r.UpdatedAt))).ToArray();
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

    public void Update(StoredLeaveRequest request)
    {
        var row = session.Context.Set<LeaveRequestRow>().Single(r => r.CompanyId == request.CompanyId && r.MembershipId == request.MembershipId && r.Guid == request.Request.Guid);
        row.ApproverGuid = request.Request.ApproverGuid;
        row.DecidedAt = request.Request.DecidedAt;
        row.UpdatedAt = request.Request.UpdatedAt ?? row.UpdatedAt;
        foreach (var date in session.Context.Set<LeaveRow>().Where(d => d.CompanyId == request.CompanyId && d.MembershipId == request.MembershipId && d.RequestId == row.Id))
        {
            var updated = request.Request.Dates.Single(d => d.Date == date.StartDate);
            date.Status = updated.Status == "Approved" ? "Used" : updated.Status == "Declined" ? "Cancelled" : updated.Status;
            date.UpdatedAt = row.UpdatedAt;
        }
    }

    public void Add(StoredLeaveRequest request)
    {
        var requestRow = new LeaveRequestRow
        {
            Guid = request.Request.Guid,
            ApproverGuid = request.Request.ApproverGuid,
            DecidedAt = request.Request.DecidedAt,
            Source = request.Request.Source,
            ClosureGuid = request.Request.ClosureGuid,
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
                Source = request.Request.Source,
                CreatedAt = request.Request.CreatedAt,
                UpdatedAt = request.Request.CreatedAt
            });
        }
    }
}

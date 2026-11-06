using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Vacate.Application.Abstractions;
using Vacate.Application.Common;
using Vacate.Domain.Common;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;

namespace Vacate.Application.Leave;

public sealed class LeaveService(IUnitOfWork work, AccessPolicy access, IMembershipRepository memberships,
    ILeaveRepository leaves, TimeProvider clock)
{
    public LeavePreview Preview(int actor, Guid company, LeaveDraft draft) => work.Execute(() =>
    {
        var (organization, member) = Own(actor, company);
        return Calculate(organization, member, draft).Preview;
    });

    public IReadOnlyList<LeaveRequestRecord> Requests(int actor, Guid company) => work.Execute(() =>
    {
        var (organization, member) = Own(actor, company);
        return leaves.Requests(organization.Id, member.Id).Select(x => x.Request).OrderByDescending(x => x.CreatedAt).ToArray();
    });

    public IReadOnlyList<LeaveCalendarDate> Calendar(int actor, Guid company) => Requests(actor, company)
        .SelectMany(request => request.Dates.Where(d => d.Status is "Approved" or "Pending")
            .Select(d => new LeaveCalendarDate(request.Guid, request.LeaveTypeId, d.Date, d.Status))).ToArray();

    public LeaveSubmission Submit(int actor, Guid company, LeaveDraft draft, Guid key, string? previewFingerprint = null) => work.Execute<LeaveSubmission>(() =>
    {
        if (key == Guid.Empty)
        {
            throw new DomainValidationException("A submission idempotency key is required.");
        }

        var (organization, member) = Own(actor, company);
        var fingerprint = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(draft))));
        var receipt = leaves.CoveredReceipt(organization.Id, member.Id, key);
        if (receipt is not null)
        {
            if (receipt != fingerprint)
            {
                throw new DomainConflictException("The submission key was already used for another draft.");
            }

            return new("already-covered", null, Calculate(organization, member, draft).Preview);
        }

        var prior = leaves.Requests(organization.Id, member.Id).SingleOrDefault(x => x.IdempotencyKey == key);
        if (prior is not null)
        {
            if (prior.Fingerprint != fingerprint)
            {
                throw new DomainConflictException("The submission key was already used for another draft.");
            }

            return new("created", prior.Request, Calculate(organization, member, draft).Preview);
        }

        var result = Calculate(organization, member, draft);
        if (previewFingerprint is not null && previewFingerprint != result.Preview.Fingerprint)
        {
            throw new DomainConflictException("The preview changed. Review the refreshed calculation before submitting.");
        }

        if (!result.Preview.CanSubmit)
        {
            throw new DomainValidationException(string.Join(" ", result.Preview.Errors));
        }

        if (result.Preview.NewDates.Count == 0)
        {
            leaves.AddCoveredReceipt(organization.Id, member.Id, key, fingerprint);
            return new("already-covered", null, result.Preview);
        }

        var request = new LeaveRequestRecord(Guid.NewGuid(), draft.LeaveTypeId, clock.GetUtcNow(), result.Dates);
        leaves.Add(new(organization.Id, member.Id, key, fingerprint, request));
        return new("created", request, result.Preview);
    });

    private (Organization Organization, Membership Member) Own(int actor, Guid company)
    {
        var organization = access.RequireMember(actor, company);
        var member = memberships.Current(actor)!;
        return (organization, member);
    }

    private (LeavePreview Preview, IReadOnlyList<LeaveDateRecord> Dates) Calculate(Organization org, Membership member, LeaveDraft draft)
    {
        var holidays = leaves.Holidays(org.Settings.CountryCode);
        var selection = Domain.Leave.LeaveCalculation.Select(draft.StartDate, draft.EndDate, draft.Duration,
            draft.Mode, org.WorkWeekDays, holidays);
        var covered = leaves.CoveredDates(org.Id, member.Id);
        var existingDates = selection.WorkingDates.Where(covered.Contains).ToArray();
        var newDates = selection.WorkingDates.Where(d => !covered.Contains(d)).ToArray();
        List<string> warnings = [];
        List<string> errors = [];
        if (draft.Unit != "days")
        {
            errors.Add("Hourly leave requests are not available yet. Choose Days.");
        }

        if (string.IsNullOrWhiteSpace(draft.LeaveTypeId))
        {
            errors.Add("Choose a leave type.");
        }

        if (selection.WorkingDates.Count == 0)
        {
            errors.Add("Select at least one working day.");
        }

        if (selection.ExcludedDates.Count > 0)
        {
            warnings.Add("Non-working days and public holidays will not be included or saved.");
        }

        var knownHolidayYears = leaves.HolidayYears(org.Settings.CountryCode);
        if (Enumerable.Range(selection.StartDate.Year, selection.EndDate.Year - selection.StartDate.Year + 1).Any(y => !knownHolidayYears.Contains(y)))
        {
            warnings.Add("Public holiday data is unavailable for part of this range; the company working schedule is used for those dates.");
        }

        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(clock.GetUtcNow(),
            TimeZoneInfo.FindSystemTimeZoneById(org.Settings.TimeZone)).DateTime);
        if (selection.WorkingDates.Any(d => d < today))
        {
            warnings.Add("Past dates are allowed and do not require approval.");
        }

        if (existingDates.Length > 0)
        {
            warnings.Add(newDates.Length == 0 ? "All selected working days already have leave recorded. No additional leave will be added."
                : "Some selected dates already have leave. Existing records are preserved and only uncovered dates will be added.");
        }

        var entitlements = leaves.Entitlements(org.Id, member.Id).Where(e => e.LeaveTypeId == draft.LeaveTypeId).ToList();
        // A configured allowance is finite even when the separate statutory policy floor is unresolved.
        // Without an explicit allowance or evaluated policy amount, keep submission blocked.
        if (draft.LeaveTypeId == "annual" && entitlements.All(e => e.Year != member.Balance.PeriodStart.Year)
            && (member.Balance.CustomAllocation ?? member.Balance.Allocation) is { } allocation)
        {
            entitlements.Add(new("annual", member.Balance.PeriodStart.Year, allocation, member.Balance.Used, member.Balance.Pending));
        }

        var balances = entitlements.ToDictionary(e => e.Year);
        foreach (var year in selection.WorkingDates.Select(d => d.Year).Distinct())
        {
            if (!balances.ContainsKey(year))
            {
                errors.Add($"No finite {draft.LeaveTypeId} balance is configured for {year}.");
            }
        }
        Dictionary<int, decimal> requested = [];
        List<LeaveDateRecord> dates = [];
        var approvalRequired = org.VacationApprovalRequired(member.Configuration.TeamId, member.Configuration.DepartmentId);
        foreach (var date in newDates)
        {
            var entitlementYear = date.Year;
            if (draft.LeaveTypeId == "annual" && org.Settings.CountryCode == "GR" && date <= new DateOnly(date.Year, 3, 31)
                && balances.TryGetValue(date.Year - 1, out var previous) && previous.Allocation - previous.Used - (approvalRequired ? 0 : previous.Pending) - requested.GetValueOrDefault(previous.Year) >= 1)
            {
                entitlementYear = previous.Year;
            }

            if (!balances.TryGetValue(entitlementYear, out var balance))
            {
                errors.Add($"No finite {draft.LeaveTypeId} balance is configured for {entitlementYear}.");
                continue;
            }

            requested[entitlementYear] = requested.GetValueOrDefault(entitlementYear) + 1;
            dates.Add(new(date, date < today || !approvalRequired ? "Approved" : "Pending", entitlementYear));
        }

        var relevantYears = selection.WorkingDates.Select(x => x.Year).Concat(requested.Keys)
            .Concat(selection.WorkingDates.Where(d => draft.LeaveTypeId == "annual" && org.Settings.CountryCode == "GR" && d.Month <= 3).Select(d => d.Year - 1)).ToHashSet();
        var previews = entitlements.Where(e => relevantYears.Contains(e.Year)).OrderBy(e => e.Year).Select(e =>
        {
            var available = e.Allocation - e.Used - (approvalRequired ? 0 : e.Pending);
            return new LeaveBalancePreview(e.LeaveTypeId, e.Year, e.Allocation, e.Used, e.Pending,
                available, requested.GetValueOrDefault(e.Year), available - requested.GetValueOrDefault(e.Year));
        }).ToArray();
        if (previews.Any(p => p.Projected < 0))
        {
            errors.Add("This request would result in a negative balance. Reduce the requested days.");
        }

        var digestData = JsonSerializer.Serialize(new { draft, selection.WorkingDates, selection.ExcludedDates, existingDates, previews, org.Settings, today, approvalRequired });
        var digest = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(digestData)));
        return (new(selection.StartDate, selection.EndDate, selection.WorkingDates, selection.ExcludedDates,
            existingDates, newDates, newDates.Length, previews, warnings, errors.Distinct().ToArray(), errors.Count == 0, digest), dates);
    }
}

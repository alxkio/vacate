using Vacate.Domain.Leave;

namespace Vacate.Application.Leave;

public sealed record LeaveDraft(string LeaveTypeId, string Unit, string Mode, DateOnly StartDate, DateOnly? EndDate, int? Duration);

public sealed record LeaveEntitlement(string LeaveTypeId, int Year, decimal Allocation, decimal Used = 0, decimal Pending = 0);

public sealed record LeaveDateRecord(DateOnly Date, string Status, int EntitlementYear);

public sealed record LeaveRequestRecord(Guid Guid, string LeaveTypeId, DateTimeOffset CreatedAt, IReadOnlyList<LeaveDateRecord> Dates);

public sealed record StoredLeaveRequest(int CompanyId, int MembershipId, Guid IdempotencyKey, string Fingerprint, LeaveRequestRecord Request);

public sealed record LeaveBalancePreview(string LeaveTypeId, int Year, decimal Allocation, decimal Used,
    decimal Pending, decimal Available, decimal Requested, decimal Projected);

public sealed record LeavePreview(DateOnly StartDate, DateOnly EndDate, IReadOnlyList<DateOnly> WorkingDates,
    IReadOnlyList<ExcludedLeaveDate> ExcludedDates, IReadOnlyList<DateOnly> CoveredDates, IReadOnlyList<DateOnly> NewDates,
    int Amount, IReadOnlyList<LeaveBalancePreview> Balances, IReadOnlyList<string> Warnings, IReadOnlyList<string> Errors, bool CanSubmit, string Fingerprint);

public sealed record LeaveSubmission(string Outcome, LeaveRequestRecord? Request, LeavePreview Preview);

public sealed record LeaveCalendarDate(Guid RequestGuid, string LeaveTypeId, DateOnly Date, string Status);

public interface ILeaveRepository
{
    IReadOnlyList<LeaveEntitlement> Entitlements(int companyId, int membershipId);

    IReadOnlyList<StoredLeaveRequest> Requests(int companyId, int membershipId);

    IReadOnlySet<DateOnly> CoveredDates(int companyId, int membershipId);

    IReadOnlySet<DateOnly> Holidays(string? countryCode);

    IReadOnlySet<int> HolidayYears(string? countryCode);

    void Add(StoredLeaveRequest request);

    string? CoveredReceipt(int companyId, int membershipId, Guid key);

    void AddCoveredReceipt(int companyId, int membershipId, Guid key, string fingerprint);
}

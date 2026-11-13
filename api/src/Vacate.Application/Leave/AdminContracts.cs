namespace Vacate.Application.Leave;

public sealed record CompanyHoliday(Guid Guid, string Name, int Month, int Day, DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt, DateTimeOffset? DeleteRequestedAt = null, DateTimeOffset? DeletedAt = null);

public sealed record ClosureDraft(string Name, DateOnly StartDate, DateOnly EndDate, bool DeductAnnualLeave);

public sealed record ClosurePersonResult(Guid UserGuid, string DisplayName, string Outcome, int Days, string? Reason);

public sealed record ClosurePreview(string Name, DateOnly StartDate, DateOnly EndDate, bool DeductAnnualLeave,
    IReadOnlyList<ClosurePersonResult> Results);

public sealed record CompanyClosure(Guid Guid, string Name, DateOnly StartDate, DateOnly EndDate, bool DeductAnnualLeave,
    DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, Guid IdempotencyKey, IReadOnlyList<ClosurePersonResult> Results,
    DateTimeOffset? DeleteRequestedAt = null, DateTimeOffset? DeletedAt = null);

public sealed record ApproverAssignment(string Scope, Guid ScopeGuid, Guid ApproverGuid);

public sealed record ApproverCandidate(Guid Guid, string DisplayName);

public sealed record CompanyAdminCalendar(IReadOnlyList<CompanyHoliday> Holidays, IReadOnlyList<CompanyClosure> Closures,
    IReadOnlyList<ApproverAssignment> Approvers, IReadOnlyList<ApproverCandidate> Candidates);

public sealed record CompanyCalendarState(IReadOnlyList<CompanyHoliday> Holidays, IReadOnlyList<CompanyClosure> Closures,
    IReadOnlyList<ApproverAssignment> Approvers)
{
    public static CompanyCalendarState Empty => new([], [], []);
}

public interface ICompanyCalendarRepository
{
    CompanyCalendarState Read(int companyId);

    void Write(int companyId, CompanyCalendarState calendar, DateTimeOffset now);
}

public sealed record ApprovalRequest(Guid RequestGuid, Guid UserGuid, string DisplayName, string LeaveTypeId,
    DateTimeOffset CreatedAt, IReadOnlyList<LeaveDateRecord> Dates, Guid? ApproverGuid, DateTimeOffset? DecidedAt);

public sealed record PersonnelLeave(Guid UserGuid, string DisplayName, string? DepartmentName, string? TeamName,
    int Year, decimal? Allocation, decimal Used, decimal Pending, decimal? Available, decimal OpeningUsed,
    IReadOnlyList<LeaveRequestRecord> Requests);

public sealed record PublishedCompanyClosure(Guid Guid, string Name, DateOnly StartDate, DateOnly EndDate, bool DeductAnnualLeave);

public sealed record MemberCompanyCalendar(IReadOnlyList<CompanyHoliday> Holidays, IReadOnlyList<PublishedCompanyClosure> Closures);

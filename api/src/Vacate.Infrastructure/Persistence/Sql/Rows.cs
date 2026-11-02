namespace Vacate.Infrastructure.Persistence.Sql;

internal abstract class EntityRow
{
    public int Id { get; set; }
    public Guid Guid { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeleteRequestedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

internal sealed class UserRow : EntityRow
{
    public string Username { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = "";
    public string Gender { get; set; } = "";
    public string Status { get; set; } = "";
    public PrivateProfileRow PrivateProfile { get; set; } = null!;
}

internal sealed class PrivateProfileRow
{
    public int UserId { get; set; }
    public bool Married { get; set; }
    public int DependentChildren { get; set; }
    public bool SoleCare { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

internal sealed class OrganizationRow : EntityRow
{
    public string Name { get; set; } = "";
    public bool IsDemo { get; set; }
    public int WorkWeekDays { get; set; }
    public bool RequireVacationApproval { get; set; }
    public bool DepartmentLeadSettingsEnabled { get; set; }
    public bool TeamLeadSettingsEnabled { get; set; }
    public bool CarryoverEnabled { get; set; }
    public int CarryoverYears { get; set; }
    public List<DepartmentRow> Departments { get; set; } = [];
    public List<TeamRow> Teams { get; set; } = [];
}

internal sealed class DepartmentRow : EntityRow
{
    public int CompanyId { get; set; }
    public string Name { get; set; } = "";
    public bool? RequireVacationApproval { get; set; }
}

internal sealed class TeamRow : EntityRow
{
    public int CompanyId { get; set; }
    public int? DepartmentId { get; set; }
    public string Name { get; set; } = "";
    public bool? RequireVacationApproval { get; set; }
}

internal sealed class MembershipRow : EntityRow
{
    public int CompanyId { get; set; }
    public int UserId { get; set; }
    public int SystemRoleId { get; set; }
    public int JobRoleId { get; set; }
    public string SettingsRole { get; set; } = "Employee";
    public int? DepartmentId { get; set; }
    public int? TeamId { get; set; }
    public int? ManagerUserId { get; set; }
    public DateOnly? HireDate { get; set; }
    public DateOnly? EmploymentEndDate { get; set; }
    public decimal? PriorServiceYears { get; set; }
    public int? WorkScheduleId { get; set; }
    public int? HolidayCalendarId { get; set; }
    public int? LeavePolicyId { get; set; }
    public MembershipEntitlementRow Entitlement { get; set; } = null!;
    public List<LeaveRow> Leaves { get; set; } = [];
}

internal sealed class MembershipEntitlementRow
{
    public int MembershipId { get; set; }
    public int CompanyId { get; set; }
    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }
    public DateOnly AsOf { get; set; }
    public string? PolicyVersion { get; set; }
    public decimal? PolicyMinimum { get; set; }
    public decimal? CustomAllocation { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

internal sealed class LeaveRow
{
    public int Id { get; set; }
    public Guid Guid { get; set; }
    public int CompanyId { get; set; }
    public int MembershipId { get; set; }
    public string EntryKind { get; set; } = "RecordedLeave";
    public string Status { get; set; } = "Pending";
    public decimal QuantityDays { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string Source { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

internal sealed class SystemRoleRow : EntityRow
{
    public string Name { get; set; } = "";
}

internal sealed class JobRoleRow : EntityRow
{
    public int CompanyId { get; set; }
    public string Name { get; set; } = "";
}

internal sealed class WorkScheduleRow : EntityRow
{
    public string Name { get; set; } = "";
}

// Compatibility metadata for the existing opt-in fictional API, never production invitations/authority.
internal sealed class DevelopmentAccessRow
{
    public int UserId { get; set; }
    public int CompanyId { get; set; }
    public bool Invited { get; set; }
    public bool CanProvision { get; set; }
}

using Vacate.Application.Common;

namespace Vacate.Application.Memberships.Commands;

// Public references are GUIDs; the service resolves them to numeric relationship keys.
public sealed record MembershipChanges(Change<Guid> SystemRoleId = default, Change<Guid> JobRoleId = default,
    Change<Guid?> DepartmentId = default, Change<Guid?> TeamId = default, Change<Guid?> ManagerUserId = default,
    Change<DateOnly?> HireDate = default, Change<DateOnly?> EmploymentEndDate = default, Change<decimal?> PriorService = default,
    Change<Guid?> WorkScheduleId = default, Change<Guid?> HolidayCalendarId = default, Change<Guid?> LeavePolicyId = default,
    Change<decimal?> CustomAllocation = default);

namespace Vacate.Application.Common;

public sealed record BalanceRecord(string LeaveTypeId, DateOnly PeriodStart, DateOnly PeriodEnd, string Unit,
    DateOnly AsOf, string? PolicyVersion, decimal? PolicyMinimum, decimal? CustomAllocation, decimal? Allocation,
    decimal Used, decimal Pending, decimal? Available);

public sealed record MembershipRecord(int Id, Guid Guid, Guid CompanyId, Guid SystemRoleId, Guid JobRoleId, Guid? DepartmentId,
    Guid? TeamId, Guid? ManagerUserId, DateOnly? HireDate, DateOnly? EmploymentEndDate, decimal? PriorService,
    Guid? WorkScheduleId, Guid? HolidayCalendarId, Guid? LeavePolicyId, BalanceRecord Balance,
    DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, DateTimeOffset? DeleteRequestedAt, DateTimeOffset? DeletedAt);

public sealed record UserRecord(int Id, Guid Guid, string Username, string FirstName, string? MiddleName,
    string LastName, string Gender, bool Married, int DependentChildren, bool SoleCare, string Status,
    MembershipRecord? Membership, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt,
    DateTimeOffset? DeleteRequestedAt, DateTimeOffset? DeletedAt);

public sealed record DirectoryUserRecord(string Username, string Email, string FirstName, string? MiddleName,
    string LastName, string Gender, string? JobTitle, string? SystemRole);

public sealed record PersonRecord(string Id, string PersonId, Guid Guid, string CompanyId, string Name, string Title,
    string DepartmentId, string TeamId, string Team, string Capability, string Role, string Initials, string Username, string Email);

public sealed record MembershipDetails(int UserId, Guid UserGuid, PersonRecord Person, MembershipRecord Membership);

public sealed record DepartmentRecord(int Id, Guid Guid, string Name, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt,
    DateTimeOffset? DeleteRequestedAt, DateTimeOffset? DeletedAt);

public sealed record TeamRecord(int Id, Guid Guid, string Name, Guid? DepartmentId, DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt, DateTimeOffset? DeleteRequestedAt, DateTimeOffset? DeletedAt);

public sealed record OrganizationRecord(int Id, Guid Guid, string Name, int WorkWeekDays, IReadOnlyList<DepartmentRecord> Departments,
    IReadOnlyList<TeamRecord> Teams, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt,
    DateTimeOffset? DeleteRequestedAt, DateTimeOffset? DeletedAt);

public sealed record OrganizationSummary(int Id, Guid Guid, string Name, int WorkWeekDays, string? DepartmentName, string? TeamName,
    IReadOnlyList<DirectoryUserRecord> TeamMembers);

public sealed record ReferenceRecord(int Id, Guid Guid, string Name);

public sealed record OrganizationReferences(IReadOnlyList<ReferenceRecord> SystemRoles,
    IReadOnlyList<ReferenceRecord> JobRoles, IReadOnlyList<ReferenceRecord> WorkSchedules);

public sealed record CurrentSession(PersonRecord Person, UserRecord Profile);

public sealed record SignInResult(string AccessToken, DateTimeOffset ExpiresAt, PersonRecord Person);

public sealed record AccountCreated(int Id, Guid Guid, string Username, DateTimeOffset CreatedAt);

public sealed record AccountState(int Id, Guid Guid, string Username, string Status, DateTimeOffset UpdatedAt);

public sealed record DeletionRequest(int Id, Guid Guid, DateTimeOffset? DeleteRequestedAt);

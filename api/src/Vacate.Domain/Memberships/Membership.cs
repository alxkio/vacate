using Vacate.Domain.Common;

namespace Vacate.Domain.Memberships;

public static class SystemRoles
{
    public const int Admin = 1;
    public const int Employee = 2;

    public static bool Contains(int id) => id is Admin or Employee;
}

public sealed record MembershipConfiguration(int SystemRoleId, int JobRoleId, int? DepartmentId = null,
    int? TeamId = null, int? ManagerUserId = null, DateOnly? HireDate = null, DateOnly? EmploymentEndDate = null,
    decimal? PriorService = null, int? WorkScheduleId = null, int? HolidayCalendarId = null, int? LeavePolicyId = null)
{
    public void Validate()
    {
        if (!SystemRoles.Contains(SystemRoleId))
        {
            throw new DomainValidationException("Unknown system role.");
        }

        if (JobRoleId < 1)
        {
            throw new DomainValidationException("A job role is required.");
        }

        if (PriorService < 0)
        {
            throw new DomainValidationException("Prior service cannot be negative.");
        }

        if (HireDate is not null && EmploymentEndDate < HireDate)
        {
            throw new DomainValidationException("Employment end must follow hire date.");
        }
    }
}

public sealed record AnnualBalance
{
    public DateOnly PeriodStart { get; }
    public DateOnly PeriodEnd { get; }
    public DateOnly AsOf { get; }
    public string? PolicyVersion { get; }
    public decimal? PolicyMinimum { get; }
    public decimal? CustomAllocation { get; }
    public decimal Used { get; }
    public decimal Pending { get; }
    public decimal? Allocation => PolicyMinimum is null ? null : CustomAllocation ?? PolicyMinimum;
    public decimal? Available => Allocation - Used - Pending;

    public AnnualBalance(DateOnly periodStart, DateOnly periodEnd, DateOnly asOf, string? policyVersion,
        decimal? policyMinimum, decimal? customAllocation, decimal used, decimal pending)
    {
        if (periodEnd < periodStart || policyMinimum < 0 || used < 0 || pending < 0)
        {
            throw new DomainValidationException("Invalid balance period or ledger values.");
        }

        if (customAllocation < (policyMinimum ?? 0))
        {
            throw new DomainValidationException("Allocation must meet the policy minimum.");
        }

        PeriodStart = periodStart;
        PeriodEnd = periodEnd;
        AsOf = asOf;
        PolicyVersion = policyVersion;
        PolicyMinimum = policyMinimum;
        CustomAllocation = customAllocation;
        Used = used;
        Pending = pending;
    }

    public AnnualBalance WithCustomAllocation(decimal? value) =>
        new(PeriodStart, PeriodEnd, AsOf, PolicyVersion, PolicyMinimum, value, Used, Pending);
}

public sealed class Membership : AggregateRoot
{
    public int UserId { get; }
    public int CompanyId { get; }
    public MembershipConfiguration Configuration { get; private set; }
    public AnnualBalance Balance { get; private set; }
    public bool IsAdmin => !IsDeleted && Configuration.SystemRoleId == SystemRoles.Admin;

    public Membership(int id, Guid guid, int userId, int companyId, MembershipConfiguration configuration,
        AnnualBalance balance, DateTimeOffset now) : base(id, guid, now)
    {
        configuration.Validate();
        UserId = userId;
        CompanyId = companyId;
        Configuration = configuration;
        Balance = balance;
    }

    public void Update(MembershipConfiguration configuration, decimal? customAllocation, DateTimeOffset now)
    {
        configuration.Validate();
        var balance = Balance.WithCustomAllocation(customAllocation);
        Touch(now);
        Configuration = configuration;
        Balance = balance;
    }
}

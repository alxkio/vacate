using Vacate.Domain.Common;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;

namespace Vacate.Infrastructure.Persistence.Sql;

internal static class RowMapper
{
    private static EntityLifecycle Lifecycle(EntityRow row) => new(row.CreatedAt, row.UpdatedAt, row.DeleteRequestedAt, row.DeletedAt);

    public static User Read(UserRow row) => User.Restore(row.Id, row.Guid, row.Username,
        new(row.FirstName, row.MiddleName, row.LastName), row.Gender,
        new(row.PrivateProfile.Married, row.PrivateProfile.DependentChildren, row.PrivateProfile.SoleCare), row.Status, Lifecycle(row));

    public static Organization Read(OrganizationRow row) => Organization.Restore(row.Id, row.Guid, row.Name, row.WorkWeekDays,
        new(row.RequireVacationApproval, row.DepartmentLeadSettingsEnabled, row.TeamLeadSettingsEnabled, row.CarryoverEnabled, row.CarryoverYears, row.TimeZone, row.CountryCode),
        row.Departments.Select(d => Department.Restore(d.Id, d.Guid, d.Name, d.RequireVacationApproval, Lifecycle(d))),
        row.Teams.Select(t => Team.Restore(t.Id, t.Guid, t.Name, t.DepartmentId, t.RequireVacationApproval, Lifecycle(t))), Lifecycle(row));

    public static Membership Read(MembershipRow row)
    {
        var b = row.Entitlement;
        return Membership.Restore(row.Id, row.Guid, row.UserId, row.CompanyId,
            new(row.SystemRoleId, row.JobRoleId, row.DepartmentId, row.TeamId, row.ManagerUserId, row.HireDate,
                row.EmploymentEndDate, row.PriorServiceYears, row.WorkScheduleId, row.HolidayCalendarId, row.LeavePolicyId),
            new(b.PeriodStart, b.PeriodEnd, b.AsOf, b.PolicyVersion, b.PolicyMinimum, b.CustomAllocation,
                row.Leaves.Where(x => x.LeaveTypeId == "annual" && (x.EntitlementYear == null || x.EntitlementYear == b.PeriodStart.Year) && x.Status == "Used").Sum(x => x.QuantityDays),
                row.Leaves.Where(x => x.LeaveTypeId == "annual" && (x.EntitlementYear == null || x.EntitlementYear == b.PeriodStart.Year) && x.Status == "Pending").Sum(x => x.QuantityDays)),
            Enum.Parse<SettingsRole>(row.SettingsRole), Lifecycle(row));
    }

    public static void Write(User user, UserRow row)
    {
        WriteLifecycle(user, row);
        row.Username = user.Username;
        row.FirstName = user.Name.FirstName;
        row.MiddleName = user.Name.MiddleName;
        row.LastName = user.Name.LastName;
        row.Gender = user.Gender;
        row.Status = user.Status;
        row.PrivateProfile ??= new() { UserId = user.Id };
        row.PrivateProfile.Married = user.Family.Married;
        row.PrivateProfile.DependentChildren = user.Family.DependentChildren;
        row.PrivateProfile.SoleCare = user.Family.SoleCare;
    }

    public static void Write(Organization organization, OrganizationRow row)
    {
        WriteLifecycle(organization, row);
        row.Name = organization.Name;
        row.TimeZone = organization.Settings.TimeZone;
        row.CountryCode = organization.Settings.CountryCode;
        row.WorkWeekDays = organization.WorkWeekDays;
        row.RequireVacationApproval = organization.Settings.RequireVacationApproval;
        row.DepartmentLeadSettingsEnabled = organization.Settings.DepartmentLeadSettingsEnabled;
        row.TeamLeadSettingsEnabled = organization.Settings.TeamLeadSettingsEnabled;
        row.CarryoverEnabled = organization.Settings.CarryoverEnabled;
        row.CarryoverYears = organization.Settings.CarryoverYears;
        foreach (var department in organization.Departments)
        {
            var child = row.Departments.SingleOrDefault(x => x.Id == department.Id);
            if (child is null)
            {
                child = new() { CompanyId = organization.Id };
                row.Departments.Add(child);
            }

            WriteLifecycle(department, child);
            child.Name = department.Name;
            child.RequireVacationApproval = department.RequireVacationApproval;
        }

        foreach (var team in organization.Teams)
        {
            var child = row.Teams.SingleOrDefault(x => x.Id == team.Id);
            if (child is null)
            {
                child = new() { CompanyId = organization.Id };
                row.Teams.Add(child);
            }

            WriteLifecycle(team, child);
            child.Name = team.Name;
            child.DepartmentId = team.DepartmentId;
            child.RequireVacationApproval = team.RequireVacationApproval;
        }
    }

    public static void Write(Membership member, MembershipRow row)
    {
        WriteLifecycle(member, row);
        var c = member.Configuration;
        Exact(c.PriorService, 8, 10000000000m);
        row.UserId = member.UserId;
        row.CompanyId = member.CompanyId;
        row.SystemRoleId = c.SystemRoleId;
        row.JobRoleId = c.JobRoleId;
        row.SettingsRole = member.SettingsRole.ToString();
        row.DepartmentId = c.DepartmentId;
        row.TeamId = c.TeamId;
        row.ManagerUserId = c.ManagerUserId;
        row.HireDate = c.HireDate;
        row.EmploymentEndDate = c.EmploymentEndDate;
        row.PriorServiceYears = c.PriorService;
        row.WorkScheduleId = c.WorkScheduleId;
        row.HolidayCalendarId = c.HolidayCalendarId;
        row.LeavePolicyId = c.LeavePolicyId;
        var b = member.Balance;
        foreach (var value in new[] { b.PolicyMinimum, b.CustomAllocation })
        {
            Exact(value, 4, 100000000m);
        }

        row.Entitlement ??= new() { MembershipId = member.Id, CompanyId = member.CompanyId };
        row.Entitlement.PeriodStart = b.PeriodStart;
        row.Entitlement.PeriodEnd = b.PeriodEnd;
        row.Entitlement.AsOf = b.AsOf;
        row.Entitlement.PolicyVersion = b.PolicyVersion;
        row.Entitlement.PolicyMinimum = b.PolicyMinimum;
        row.Entitlement.CustomAllocation = b.CustomAllocation;
    }

    private static void Exact(decimal? value, int scale, decimal limit)
    {
        if (value is { } number && (Math.Abs(number) >= limit || decimal.Round(number, scale) != number))
        {
            throw new DomainValidationException("The quantity cannot be stored without loss of precision.");
        }
    }

    private static void WriteLifecycle(Entity entity, EntityRow row)
    {
        row.Id = entity.Id;
        row.Guid = entity.Guid;
        row.CreatedAt = entity.CreatedAt;
        row.UpdatedAt = entity.UpdatedAt;
        row.DeleteRequestedAt = entity.DeleteRequestedAt;
        row.DeletedAt = entity.DeletedAt;
    }
}

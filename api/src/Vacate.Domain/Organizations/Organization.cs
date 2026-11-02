using Vacate.Domain.Common;

namespace Vacate.Domain.Organizations;

public sealed class Department(int id, Guid guid, string name, DateTimeOffset now) : Entity(id, guid, now)
{
    public bool? RequireVacationApproval { get; private set; }

    public static Department Restore(int id, Guid guid, string name, bool? approval, EntityLifecycle lifecycle)
    {
        var department = new Department(id, guid, name, lifecycle.CreatedAt);
        department.SetApproval(approval, lifecycle.UpdatedAt);
        department.RestoreLifecycle(lifecycle);
        return department;
    }

    internal void SetApproval(bool? required, DateTimeOffset now)
    {
        Touch(now);
        RequireVacationApproval = required;
    }

    public string Name { get; private set; } = DomainValue.Name(name, "department name");

    internal void RequestDeletion(DateTimeOffset now) => RequestDeletionCore(now);

    internal void Delete(DateTimeOffset now) => DeleteCore(now);

    internal void Rename(string name, DateTimeOffset now)
    {
        var valid = DomainValue.Name(name, "name");
        Touch(now);
        Name = valid;
    }
}

public sealed class Team(int id, Guid guid, string name, int? departmentId, DateTimeOffset now) : Entity(id, guid, now)
{
    public bool? RequireVacationApproval { get; private set; }

    public static Team Restore(int id, Guid guid, string name, int? departmentId, bool? approval, EntityLifecycle lifecycle)
    {
        var team = new Team(id, guid, name, departmentId, lifecycle.CreatedAt);
        team.SetApproval(approval, lifecycle.UpdatedAt);
        team.RestoreLifecycle(lifecycle);
        return team;
    }

    internal void SetApproval(bool? required, DateTimeOffset now)
    {
        Touch(now);
        RequireVacationApproval = required;
    }

    public string Name { get; private set; } = DomainValue.Name(name, "team name");

    internal void RequestDeletion(DateTimeOffset now) => RequestDeletionCore(now);

    internal void Delete(DateTimeOffset now) => DeleteCore(now);
    public int? DepartmentId { get; private set; } = departmentId;

    internal void Update(string name, int? departmentId, DateTimeOffset now)
    {
        var valid = DomainValue.Name(name, "name");
        Touch(now);
        Name = valid;
        DepartmentId = departmentId;
    }
}

public sealed class Organization : AggregateRoot
{
    private readonly List<Department> departments = [];
    private readonly List<Team> teams = [];
    public string Name { get; private set; }
    public int WorkWeekDays { get; private set; }
    public VacationSettings Settings { get; private set; } = new();
    public IReadOnlyList<Department> Departments => departments.AsReadOnly();
    public IReadOnlyList<Team> Teams => teams.AsReadOnly();

    public Organization(int id, Guid guid, string name, int workWeekDays, DateTimeOffset now) : base(id, guid, now)
    {
        Name = DomainValue.Name(name, "organization name");
        WorkWeekDays = ValidateWeek(workWeekDays);
    }

    public static Organization Restore(int id, Guid guid, string name, int workWeekDays, VacationSettings settings,
        IEnumerable<Department> departments, IEnumerable<Team> teams, EntityLifecycle lifecycle)
    {
        var organization = new Organization(id, guid, name, workWeekDays, lifecycle.CreatedAt);
        organization.Settings = settings;
        organization.departments.AddRange(departments);
        organization.teams.AddRange(teams);
        organization.RestoreLifecycle(lifecycle);
        return organization;
    }

    private static int ValidateWeek(int days) => days is 5 or 6 ? days : throw new DomainValidationException("Choose five or six working days.");

    public void Update(string name, int days, DateTimeOffset now, VacationSettings? settings = null)
    {
        var valid = DomainValue.Name(name, "organization name");
        var week = ValidateWeek(days);
        Touch(now);
        Name = valid;
        WorkWeekDays = week;
        Settings = settings ?? Settings;
    }

    public bool VacationApprovalRequired(int? teamId, int? departmentId)
    {
        var team = teams.SingleOrDefault(t => !t.IsDeleted && t.Id == teamId);
        var department = departments.SingleOrDefault(d => !d.IsDeleted && d.Id == (team?.DepartmentId ?? departmentId));
        return team?.RequireVacationApproval ?? department?.RequireVacationApproval ?? Settings.RequireVacationApproval;
    }

    public void SetDepartmentApproval(int id, bool? required, DateTimeOffset now)
    {
        Department(id).SetApproval(required, now);
        Touch(now);
    }

    public void SetTeamApproval(int id, bool? required, DateTimeOffset now)
    {
        Team(id).SetApproval(required, now);
        Touch(now);
    }

    public Department AddDepartment(int id, Guid guid, string name, DateTimeOffset now)
    {
        var department = new Department(id, guid, name, now);
        Touch(now);
        departments.Add(department);
        return department;
    }

    public Team AddTeam(int id, Guid guid, string name, int? departmentId, DateTimeOffset now)
    {
        ValidateDepartment(departmentId);
        var team = new Team(id, guid, name, departmentId, now);
        Touch(now);
        teams.Add(team);
        return team;
    }

    public void RenameDepartment(int id, string name, DateTimeOffset now)
    {
        var department = Department(id);
        department.Rename(name, now);
        Touch(now);
    }

    public void UpdateTeam(int id, string name, int? departmentId, DateTimeOffset now)
    {
        ValidateDepartment(departmentId);
        Team(id).Update(name, departmentId, now);
        Touch(now);
    }

    public Department Department(int id) => departments.SingleOrDefault(x => x.Id == id && !x.IsDeleted)
        ?? throw new DomainValidationException("Department unavailable in this organization.");

    public Team Team(int id) => teams.SingleOrDefault(x => x.Id == id && !x.IsDeleted)
        ?? throw new DomainValidationException("Team unavailable in this organization.");

    public void ValidateDepartment(int? id)
    {
        if (id is not null)
        {
            Department(id.Value);
        }
    }

    public void RequestDepartmentDeletion(int id, DateTimeOffset now)
    {
        Department(id).RequestDeletion(now);
        Touch(now);
    }

    public void RequestTeamDeletion(int id, DateTimeOffset now)
    {
        Team(id).RequestDeletion(now);
        Touch(now);
    }

    public void DeleteDepartment(int id, DateTimeOffset now)
    {
        var node = Department(id);
        if (teams.Any(x => !x.IsDeleted && x.DepartmentId == id))
        {
            throw new DomainConflictException("Remove team references before deleting this department.");
        }

        node.Delete(now);
        Touch(now);
    }

    public void DeleteTeam(int id, DateTimeOffset now)
    {
        Team(id).Delete(now);
        Touch(now);
    }

    public override void Delete(DateTimeOffset now)
    {
        if (departments.Any(x => !x.IsDeleted) || teams.Any(x => !x.IsDeleted))
        {
            throw new DomainConflictException("Remove structure before deleting the organization.");
        }

        base.Delete(now);
    }
}

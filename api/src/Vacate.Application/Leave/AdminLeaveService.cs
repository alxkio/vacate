using Vacate.Application.Abstractions;
using Vacate.Application.Common;
using Vacate.Domain.Common;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;

namespace Vacate.Application.Leave;

public sealed class AdminLeaveService(IUnitOfWork work, AccessPolicy access, IMembershipRepository memberships,
    IUserRepository users, ILeaveRepository leaves, ICompanyCalendarRepository calendars, TimeProvider clock)
{
    public CompanyAdminCalendar Calendar(int actor, Guid company) => work.Execute(() =>
    {
        var org = access.RequireAdmin(actor, company);
        return Projection(org);
    });

    public MemberCompanyCalendar MemberCalendar(int actor, Guid company) => work.Execute(() =>
    {
        var org = access.RequireMember(actor, company);
        var data = calendars.Read(org.Id);
        return new MemberCompanyCalendar(data.Holidays, data.Closures.Select(c => new PublishedCompanyClosure(c.Guid, c.Name, c.StartDate, c.EndDate, c.DeductAnnualLeave)).ToArray());
    });

    public CompanyHoliday AddHoliday(int actor, Guid company, string name, int month, int day) => work.Execute(() =>
    {
        var org = access.RequireAdmin(actor, company);
        name = Domain.Leave.CompanyCalendar.Holiday(name, month, day);
        var data = calendars.Read(org.Id);
        if (data.Holidays.Any(h => h.Month == month && h.Day == day))
        {
            throw new DomainConflictException("A recurring company holiday already exists on this date.");
        }

        var now = clock.GetUtcNow();
        var holiday = new CompanyHoliday(Guid.NewGuid(), name, month, day, now, now);
        calendars.Write(org.Id, data with { Holidays = [.. data.Holidays, holiday] }, now);
        return holiday;
    });

    public CompanyAdminCalendar SetApprover(int actor, Guid company, string scope, Guid scopeGuid, Guid? approverGuid) => work.Execute(() =>
    {
        var org = access.RequireAdmin(actor, company);
        if (!(scope == "organization" && scopeGuid == org.Guid
            || scope == "department" && org.Departments.Any(d => !d.IsDeleted && d.Guid == scopeGuid)
            || scope == "team" && org.Teams.Any(t => !t.IsDeleted && t.Guid == scopeGuid)))
        {
            throw new DomainValidationException("Choose a scope in this company.");
        }

        if (approverGuid is not null)
        {
            var user = users.FindByGuid(approverGuid.Value);
            if (user?.CanSignIn != true || memberships.Current(user.Id) is not { IsAdmin: true } member || member.CompanyId != org.Id)
            {
                throw new DomainValidationException("Choose an active company administrator as approver.");
            }
        }

        var data = calendars.Read(org.Id);
        var assignments = data.Approvers.Where(a => a.Scope != scope || a.ScopeGuid != scopeGuid).ToList();
        if (approverGuid is not null)
        {
            assignments.Add(new(scope, scopeGuid, approverGuid.Value));
        }

        var updatedCalendar = data with { Approvers = assignments };
        var now = clock.GetUtcNow();
        calendars.Write(org.Id, updatedCalendar, now);
        foreach (var member in ActiveMembers(org))
        {
            foreach (var pending in leaves.Requests(org.Id, member.Id).Where(r => r.Request.Dates.Any(d => d.Status == "Pending")))
            {
                var approver = ResolveApprover(updatedCalendar, org, member);
                leaves.Update(pending with { Request = pending.Request with { ApproverGuid = approver, UpdatedAt = now } });
            }
        }

        return Projection(org, updatedCalendar);
    });

    public ClosurePreview PreviewClosure(int actor, Guid company, ClosureDraft draft) => work.Execute(() =>
    {
        var org = access.RequireAdmin(actor, company);
        return Plan(org, draft).Preview;
    });

    public CompanyClosure PublishClosure(int actor, Guid company, ClosureDraft draft, Guid key) => work.Execute(() =>
    {
        var org = access.RequireAdmin(actor, company);
        if (key == Guid.Empty)
        {
            throw new DomainValidationException("A closure idempotency key is required.");
        }

        var data = calendars.Read(org.Id);
        var prior = data.Closures.SingleOrDefault(c => c.IdempotencyKey == key);
        if (prior is not null)
        {
            if (prior.Name != draft.Name.Trim() || prior.StartDate != draft.StartDate || prior.EndDate != draft.EndDate || prior.DeductAnnualLeave != draft.DeductAnnualLeave)
            {
                throw new DomainConflictException("This publication key was already used for another closure.");
            }

            return prior;
        }

        var plan = Plan(org, draft);
        var now = clock.GetUtcNow();
        var closure = new CompanyClosure(Guid.NewGuid(), plan.Preview.Name, draft.StartDate, draft.EndDate,
            draft.DeductAnnualLeave, now, now, key, plan.Preview.Results);
        foreach (var item in plan.Records)
        {
            var request = new LeaveRequestRecord(Guid.NewGuid(), draft.DeductAnnualLeave ? "annual" : "company-closure", now,
                item.Dates, Source: "CompanyClosure", ClosureGuid: closure.Guid, UpdatedAt: now);
            leaves.Add(new(org.Id, item.Member.Id, Guid.NewGuid(), closure.Guid.ToString("N"), request));
        }

        calendars.Write(org.Id, data with { Closures = [.. data.Closures, closure] }, now);
        return closure;
    });

    public IReadOnlyList<ApprovalRequest> Inbox(int actor, Guid company) => work.Execute(() =>
    {
        var org = access.RequireAdmin(actor, company);
        if (memberships.Current(actor) is not { IsAdmin: true } approverMembership || approverMembership.CompanyId != org.Id)
        {
            throw new ServiceException(ServiceError.NotFound, "Assigned requests unavailable.");
        }

        var actorGuid = access.Actor(actor).Guid;
        var calendar = calendars.Read(org.Id);
        return ActiveMembers(org).SelectMany(m => leaves.Requests(org.Id, m.Id).Where(r =>
                ResolveApprover(calendar, org, m) == actorGuid && r.Request.Dates.Any(d => d.Status == "Pending"))
            .Select(r => Approval(m, r.Request with { ApproverGuid = actorGuid }))).OrderBy(r => r.CreatedAt).ToArray();
    });

    public ApprovalRequest Decide(int actor, Guid company, Guid requestGuid, string decision) => work.Execute(() =>
    {
        var org = access.RequireAdmin(actor, company);
        if (decision is not ("approve" or "decline"))
        {
            throw new DomainValidationException("Choose approve or decline.");
        }

        if (memberships.Current(actor) is not { IsAdmin: true } approverMembership || approverMembership.CompanyId != org.Id)
        {
            throw new ServiceException(ServiceError.NotFound, "Assigned requests unavailable.");
        }

        var actorGuid = access.Actor(actor).Guid;
        var match = ActiveMembers(org).SelectMany(m => leaves.Requests(org.Id, m.Id).Where(r => r.Request.Guid == requestGuid)
            .Select(r => (Member: m, Stored: r))).SingleOrDefault();
        if (match.Stored is null)
        {
            throw new ServiceException(ServiceError.NotFound, "Assigned request unavailable.");
        }

        var effectiveApprover = match.Stored.Request.Dates.Any(d => d.Status == "Pending")
            ? ResolveApprover(calendars.Read(org.Id), org, match.Member) : match.Stored.Request.ApproverGuid;
        if (effectiveApprover != actorGuid)
        {
            throw new ServiceException(ServiceError.NotFound, "Assigned request unavailable.");
        }

        var original = match.Stored.Request;
        var pending = original.Dates.Where(d => d.Status == "Pending").ToArray();
        if (pending.Length == 0)
        {
            throw new DomainConflictException("This request has already been decided. Reload the inbox.");
        }

        if (decision == "approve")
        {
            var balances = Entitlements(org, match.Member, original.LeaveTypeId);
            foreach (var year in pending.GroupBy(d => d.EntitlementYear))
            {
                var balance = balances.SingleOrDefault(b => b.Year == year.Key);
                var approvalRequired = org.VacationApprovalRequired(match.Member.Configuration.TeamId, match.Member.Configuration.DepartmentId);
                var reservedOtherPending = approvalRequired ? 0 : Math.Max(0, (balance?.Pending ?? 0) - year.Count());
                if (balance is null || balance.Allocation - balance.Used - reservedOtherPending < year.Count())
                {
                    throw new DomainValidationException($"Insufficient or unknown {original.LeaveTypeId} balance for {year.Key}. The request remains pending.");
                }
            }
        }

        var now = clock.GetUtcNow();
        var updated = original with { Dates = original.Dates.Select(d => d.Status == "Pending" ? d with { Status = decision == "approve" ? "Approved" : "Declined" } : d).ToArray(), ApproverGuid = actorGuid, DecidedAt = now, UpdatedAt = now };
        leaves.Update(match.Stored with { Request = updated });
        return Approval(match.Member, updated);
    });

    public IReadOnlyList<PersonnelLeave> Personnel(int actor, Guid company, int year) => work.Execute(() =>
    {
        var org = access.RequireAdmin(actor, company);
        if (year is < 1 or > 9999)
        {
            throw new DomainValidationException("Choose a valid year.");
        }

        return ActiveMembers(org).Select(member =>
        {
            var user = users.Find(member.UserId)!;
            var balance = Entitlements(org, member, "annual").SingleOrDefault(e => e.Year == year);
            var all = leaves.Requests(org.Id, member.Id).Select(r => r.Request).ToArray();
            var annualDates = all.Where(r => r.LeaveTypeId == "annual").SelectMany(r => r.Dates).Where(d => d.EntitlementYear == year).ToArray();
            var datedUsed = annualDates.Count(d => d.Status == "Approved");
            var used = balance?.Used ?? (member.Balance.PeriodStart.Year == year ? member.Balance.Used : datedUsed);
            var pending = balance?.Pending ?? (member.Balance.PeriodStart.Year == year ? member.Balance.Pending : annualDates.Count(d => d.Status == "Pending"));
            return new PersonnelLeave(user.Guid, Name(user), org.Departments.SingleOrDefault(d => !d.IsDeleted && d.Id == member.Configuration.DepartmentId)?.Name,
                org.Teams.SingleOrDefault(t => !t.IsDeleted && t.Id == member.Configuration.TeamId)?.Name,
                year, balance?.Allocation, used, pending, balance is null ? null : balance.Allocation - balance.Used
                    - (org.VacationApprovalRequired(member.Configuration.TeamId, member.Configuration.DepartmentId) ? 0 : balance.Pending),
                Math.Max(0, used - datedUsed), all.Where(r => r.Dates.Any(d => d.Date.Year == year))
                    .Select(r => r with { Dates = r.Dates.Where(d => d.Date.Year == year).ToArray() }).ToArray());
        }).ToArray();
    });

    private CompanyAdminCalendar Projection(Organization org, CompanyCalendarState? current = null)
    {
        var data = current ?? calendars.Read(org.Id);
        return new(data.Holidays, data.Closures, data.Approvers, ActiveMembers(org).Where(m => m.IsAdmin)
            .Select(m => users.Find(m.UserId)!).Select(u => new ApproverCandidate(u.Guid, Name(u))).ToArray());
    }

    private IEnumerable<Membership> ActiveMembers(Organization org) => memberships.ForOrganization(org.Id)
        .Where(m => !m.IsDeleted && users.Find(m.UserId)?.CanSignIn == true);

    private ApprovalRequest Approval(Membership member, LeaveRequestRecord request)
    {
        var user = users.Find(member.UserId)!;
        return new(request.Guid, user.Guid, Name(user), request.LeaveTypeId, request.CreatedAt, request.Dates, request.ApproverGuid, request.DecidedAt);
    }

    private static string Name(User user) => $"{user.Name.FirstName} {user.Name.LastName}";

    private IReadOnlyList<LeaveEntitlement> Entitlements(Organization org, Membership member, string type)
    {
        var result = leaves.Entitlements(org.Id, member.Id).Where(e => e.LeaveTypeId == type).ToList();
        if (type == "annual" && result.All(e => e.Year != member.Balance.PeriodStart.Year)
            && (member.Balance.CustomAllocation ?? member.Balance.Allocation) is { } allocation)
        {
            result.Add(new(type, member.Balance.PeriodStart.Year, allocation, member.Balance.Used, member.Balance.Pending));
        }

        return result;
    }

    private (ClosurePreview Preview, List<(Membership Member, IReadOnlyList<LeaveDateRecord> Dates)> Records) Plan(Organization org, ClosureDraft draft)
    {
        var name = Domain.Leave.CompanyCalendar.Closure(draft.Name, draft.StartDate, draft.EndDate);
        var holidays = leaves.Holidays(org.Settings.CountryCode).Concat(RecurringDates(calendars.Read(org.Id), draft.StartDate.Year, draft.EndDate.Year)).ToHashSet();
        var working = Domain.Leave.LeaveCalculation.Select(draft.StartDate, draft.EndDate, null, "range", org.WorkWeekDays, holidays).WorkingDates;
        List<ClosurePersonResult> results = [];
        List<(Membership Member, IReadOnlyList<LeaveDateRecord> Dates)> records = [];
        foreach (var member in ActiveMembers(org))
        {
            var user = users.Find(member.UserId)!;
            var dates = working.Where(d => (member.Configuration.HireDate is null || d >= member.Configuration.HireDate)
                && (member.Configuration.EmploymentEndDate is null || d <= member.Configuration.EmploymentEndDate)).ToArray();
            if (dates.Length == 0)
            {
                results.Add(new(user.Guid, Name(user), "skipped", 0, "No applicable working dates within employment dates."));
                continue;
            }

            var covered = leaves.CoveredDates(org.Id, member.Id);
            var uncovered = dates.Where(d => !covered.Contains(d)).ToArray();
            if (uncovered.Length == 0)
            {
                results.Add(new(user.Guid, Name(user), "already-covered", 0, "No uncovered working dates within employment dates."));
                continue;
            }

            var balances = Entitlements(org, member, "annual");
            var approvalRequired = org.VacationApprovalRequired(member.Configuration.TeamId, member.Configuration.DepartmentId);
            Dictionary<int, decimal> requested = [];
            List<LeaveDateRecord> charges = [];
            var failed = false;
            foreach (var date in uncovered)
            {
                var year = date.Year;
                if (draft.DeductAnnualLeave && org.Settings.CountryCode == "GR" && date <= new DateOnly(date.Year, 3, 31)
                    && balances.SingleOrDefault(b => b.Year == date.Year - 1) is { } previous
                    && previous.Allocation - previous.Used - (approvalRequired ? 0 : previous.Pending) - requested.GetValueOrDefault(previous.Year) >= 1)
                {
                    year--;
                }

                var balance = balances.SingleOrDefault(b => b.Year == year);
                requested[year] = requested.GetValueOrDefault(year) + 1;
                if (draft.DeductAnnualLeave && (balance is null || balance.Allocation - balance.Used - (approvalRequired ? 0 : balance.Pending) - requested[year] < 0))
                {
                    failed = true;
                }

                charges.Add(new(date, "Approved", year));
            }

            if (failed)
            {
                results.Add(new(user.Guid, Name(user), "skipped", 0, "Insufficient or unknown annual leave balance. No dates recorded for this employee."));
                continue;
            }

            results.Add(new(user.Guid, Name(user), "recorded", charges.Count, dates.Length != uncovered.Length ? "Existing leave dates preserved." : null));
            records.Add((member, charges));
        }

        return (new(name, draft.StartDate, draft.EndDate, draft.DeductAnnualLeave, results), records);
    }

    public static IReadOnlySet<DateOnly> RecurringDates(CompanyCalendarState state, int startYear, int endYear) =>
        Enumerable.Range(startYear, endYear - startYear + 1).SelectMany(y => state.Holidays
            .Where(h => h.DeletedAt is null && (h.Month != 2 || h.Day != 29 || DateTime.IsLeapYear(y)))
            .Select(h => new DateOnly(y, h.Month, h.Day))).ToHashSet();

    public static Guid? ResolveApprover(CompanyCalendarState state, Organization org, Membership member)
    {
        var team = org.Teams.SingleOrDefault(t => !t.IsDeleted && t.Id == member.Configuration.TeamId);
        var department = org.Departments.SingleOrDefault(d => !d.IsDeleted && d.Id == (team?.DepartmentId ?? member.Configuration.DepartmentId));
        return state.Approvers.SingleOrDefault(a => a.Scope == "team" && a.ScopeGuid == team?.Guid)?.ApproverGuid
            ?? state.Approvers.SingleOrDefault(a => a.Scope == "department" && a.ScopeGuid == department?.Guid)?.ApproverGuid
            ?? state.Approvers.SingleOrDefault(a => a.Scope == "organization" && a.ScopeGuid == org.Guid)?.ApproverGuid;
    }
}

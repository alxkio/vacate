using Microsoft.EntityFrameworkCore;
using Vacate.Application.Leave;

namespace Vacate.Infrastructure.Persistence.Sql;

internal sealed class SqlCompanyCalendar(SqlSession session) : ICompanyCalendarRepository
{
    public CompanyCalendarState Read(int companyId)
    {
        session.Company(companyId);
        var holidays = session.Context.Set<CompanyHolidayRow>().Where(h => h.CompanyId == companyId && h.DeletedAt == null).ToArray()
            .Select(h => new CompanyHoliday(h.Guid, h.Name, h.Month, h.Day, h.CreatedAt, h.UpdatedAt, h.DeleteRequestedAt, h.DeletedAt)).ToArray();
        var closures = session.Context.Set<CompanyClosureRow>().Where(c => c.CompanyId == companyId && c.DeletedAt == null).Include(c => c.Results).ToArray()
            .Select(c => new CompanyClosure(c.Guid, c.Name, c.StartDate, c.EndDate, c.DeductAnnualLeave, c.CreatedAt, c.UpdatedAt, c.IdempotencyKey,
                c.Results.Select(r => new ClosurePersonResult(r.UserGuid, r.DisplayName, r.Outcome, r.Days, r.Reason)).ToArray(), c.DeleteRequestedAt, c.DeletedAt)).ToArray();
        var assignments = session.Context.Set<CompanyApproverRow>().Where(a => a.CompanyId == companyId && a.DeletedAt == null).ToArray()
            .Select(a => new ApproverAssignment(a.Scope, a.ScopeGuid, a.ApproverGuid)).ToArray();
        return new(holidays, closures, assignments);
    }

    public void Write(int companyId, CompanyCalendarState calendar, DateTimeOffset now)
    {
        session.Company(companyId);
        var existingHolidays = session.Context.Set<CompanyHolidayRow>().Where(h => h.CompanyId == companyId).ToArray();
        foreach (var holiday in calendar.Holidays.Where(h => existingHolidays.All(r => r.Guid != h.Guid)))
        {
            session.Context.Add(new CompanyHolidayRow
            {
                Id = session.Next("CompanyHolidayIds"), Guid = holiday.Guid, CompanyId = companyId, Name = holiday.Name,
                Month = holiday.Month, Day = holiday.Day, CreatedAt = holiday.CreatedAt, UpdatedAt = holiday.UpdatedAt
            });
        }

        var existingClosures = session.Context.Set<CompanyClosureRow>().Where(c => c.CompanyId == companyId).ToArray();
        foreach (var closure in calendar.Closures.Where(c => existingClosures.All(r => r.Guid != c.Guid)))
        {
            var row = new CompanyClosureRow
            {
                Id = session.Next("CompanyClosureIds"), Guid = closure.Guid, CompanyId = companyId, Name = closure.Name,
                StartDate = closure.StartDate, EndDate = closure.EndDate, DeductAnnualLeave = closure.DeductAnnualLeave,
                IdempotencyKey = closure.IdempotencyKey, CreatedAt = closure.CreatedAt, UpdatedAt = closure.UpdatedAt
            };
            row.Results = closure.Results.Select(r => new CompanyClosureResultRow
            {
                CompanyId = companyId, ClosureId = row.Id, UserGuid = r.UserGuid, DisplayName = r.DisplayName,
                Outcome = r.Outcome, Days = r.Days, Reason = r.Reason
            }).ToList();
            session.Context.Add(row);
        }

        var assignments = session.Context.Set<CompanyApproverRow>().Where(a => a.CompanyId == companyId && a.DeletedAt == null).ToArray();
        foreach (var row in assignments)
        {
            var current = calendar.Approvers.SingleOrDefault(a => a.Scope == row.Scope && a.ScopeGuid == row.ScopeGuid);
            if (current is null)
            {
                row.UpdatedAt = now;
                row.DeleteRequestedAt = now;
                row.DeletedAt = now;
            }
            else if (row.ApproverGuid != current.ApproverGuid)
            {
                row.UpdatedAt = now;
                row.ApproverGuid = current.ApproverGuid;
            }
        }

        foreach (var assignment in calendar.Approvers.Where(a => assignments.All(r => r.Scope != a.Scope || r.ScopeGuid != a.ScopeGuid)))
        {
            session.Context.Add(new CompanyApproverRow
            {
                Id = session.Next("CompanyApproverIds"), Guid = Guid.NewGuid(), CompanyId = companyId,
                Scope = assignment.Scope, ScopeGuid = assignment.ScopeGuid, ApproverGuid = assignment.ApproverGuid,
                CreatedAt = now, UpdatedAt = now
            });
        }
    }
}

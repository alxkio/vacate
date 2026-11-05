using Vacate.Domain.Common;

namespace Vacate.Domain.Leave;

public sealed record ExcludedLeaveDate(DateOnly Date, string Reason);

public sealed record WorkingDateSelection(DateOnly StartDate, DateOnly EndDate,
    IReadOnlyList<DateOnly> WorkingDates, IReadOnlyList<ExcludedLeaveDate> ExcludedDates);

public static class LeaveCalculation
{
    public static WorkingDateSelection Select(DateOnly start, DateOnly? end, int? duration,
        string mode, int workingWeekDays, IReadOnlySet<DateOnly> holidays)
    {
        if (workingWeekDays is not (5 or 6) || mode is not ("duration" or "range"))
        {
            throw new DomainValidationException("Choose a valid entry mode and working schedule.");
        }

        if (mode == "range" && (end is null || end < start) || mode == "duration" && (duration is null or <= 0))
        {
            throw new DomainValidationException("Enter an end date on or after the start, or a positive whole-day duration.");
        }

        if (mode == "range" && duration is not null || mode == "duration" && end is not null)
        {
            throw new DomainValidationException("Use only the fields for the selected entry mode.");
        }

        if (duration > 3660 || end is { } rangeEnd && rangeEnd.DayNumber - start.DayNumber > 3660)
        {
            throw new DomainValidationException("Select a range or duration of at most 3660 days.");
        }

        List<DateOnly> working = [];
        List<ExcludedLeaveDate> excluded = [];
        var date = start;
        while (true)
        {
            var weekend = date.DayOfWeek == DayOfWeek.Sunday || workingWeekDays == 5 && date.DayOfWeek == DayOfWeek.Saturday;
            if (weekend || holidays.Contains(date))
            {
                excluded.Add(new(date, weekend ? "Non-working day" : "Public holiday"));
            }
            else
            {
                working.Add(date);
            }

            if (mode == "duration" ? working.Count == duration : date == end)
            {
                return new(start, date, working, excluded);
            }

            if (date == DateOnly.MaxValue || date.DayNumber - start.DayNumber >= 3660)
            {
                throw new DomainValidationException("The duration exceeds the supported date range.");
            }

            date = date.AddDays(1);
        }
    }
}

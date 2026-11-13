using Vacate.Domain.Common;

namespace Vacate.Domain.Leave;

public static class CompanyCalendar
{
    public static string Holiday(string name, int month, int day)
    {
        var valid = DomainValue.Name(name, "holiday name");
        if (month is < 1 or > 12 || day < 1 || day > DateTime.DaysInMonth(2000, month))
        {
            throw new DomainValidationException("Choose a valid recurring month and day. February 29 applies in leap years only.");
        }

        return valid;
    }

    public static string Closure(string name, DateOnly start, DateOnly end)
    {
        var valid = DomainValue.Name(name, "closure name");
        if (end < start || end.DayNumber - start.DayNumber > 366)
        {
            throw new DomainValidationException("Choose a closure end on or after its start, within 366 days.");
        }

        return valid;
    }
}

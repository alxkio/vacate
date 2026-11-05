using Vacate.Domain.Common;

namespace Vacate.Domain.Organizations;

public sealed record VacationSettings
{
    public bool RequireVacationApproval { get; }
    public bool DepartmentLeadSettingsEnabled { get; }
    public bool TeamLeadSettingsEnabled { get; }
    public bool CarryoverEnabled { get; }
    public int CarryoverYears { get; }
    public string TimeZone { get; }
    public string? CountryCode { get; }

    public VacationSettings(bool requireVacationApproval = true, bool departmentLeadSettingsEnabled = false,
        bool teamLeadSettingsEnabled = false, bool carryoverEnabled = false, int carryoverYears = 0, string timeZone = "UTC", string? countryCode = null)
    {
        if (carryoverYears < 0)
        {
            throw new DomainValidationException("Carryover years must be zero (unlimited) or a positive whole number.");
        }

        try
        {
            TimeZoneInfo.FindSystemTimeZoneById(timeZone);
        }
        catch (Exception error) when (error is TimeZoneNotFoundException or InvalidTimeZoneException or ArgumentException)
        {
            throw new DomainValidationException("Choose a valid timezone identifier.");
        }

        if (countryCode is not null && (countryCode.Length != 2 || countryCode.Any(c => c < 'A' || c > 'Z')))
        {
            throw new DomainValidationException("Use a two-letter uppercase country code.");
        }

        TimeZone = timeZone;
        CountryCode = countryCode;
        RequireVacationApproval = requireVacationApproval;
        DepartmentLeadSettingsEnabled = departmentLeadSettingsEnabled;
        TeamLeadSettingsEnabled = teamLeadSettingsEnabled;
        CarryoverEnabled = carryoverEnabled;
        CarryoverYears = carryoverYears;
    }
}

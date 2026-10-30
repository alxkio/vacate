using Vacate.Domain.Common;

namespace Vacate.Domain.Organizations;

public sealed record VacationSettings
{
    public bool RequireVacationApproval { get; }
    public bool DepartmentLeadSettingsEnabled { get; }
    public bool TeamLeadSettingsEnabled { get; }
    public bool CarryoverEnabled { get; }
    public int CarryoverYears { get; }

    public VacationSettings(bool requireVacationApproval = true, bool departmentLeadSettingsEnabled = false,
        bool teamLeadSettingsEnabled = false, bool carryoverEnabled = false, int carryoverYears = 0)
    {
        if (carryoverYears < 0)
        {
            throw new DomainValidationException("Carryover years must be zero (unlimited) or a positive whole number.");
        }

        RequireVacationApproval = requireVacationApproval;
        DepartmentLeadSettingsEnabled = departmentLeadSettingsEnabled;
        TeamLeadSettingsEnabled = teamLeadSettingsEnabled;
        CarryoverEnabled = carryoverEnabled;
        CarryoverYears = carryoverYears;
    }
}

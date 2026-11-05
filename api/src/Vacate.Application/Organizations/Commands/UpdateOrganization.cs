using Vacate.Application.Common;

namespace Vacate.Application.Organizations.Commands;

public sealed record UpdateOrganization(Guid Guid, Change<string> Name = default, Change<int> WorkWeekDays = default,
    Change<bool> RequireVacationApproval = default, Change<bool> DepartmentLeadSettingsEnabled = default,
    Change<bool> TeamLeadSettingsEnabled = default, Change<bool> CarryoverEnabled = default, Change<int> CarryoverYears = default, Change<string> TimeZone = default, Change<string?> CountryCode = default);

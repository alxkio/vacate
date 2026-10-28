using Vacate.Application.Common;

namespace Vacate.Application.Organizations.Commands;

public sealed record UpdateOrganization(Guid Guid, Change<string> Name = default, Change<int> WorkWeekDays = default);

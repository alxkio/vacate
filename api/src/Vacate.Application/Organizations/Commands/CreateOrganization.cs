using Vacate.Application.Common;

namespace Vacate.Application.Organizations.Commands;

public sealed record CreateOrganization(string Name, int WorkWeekDays = 5);

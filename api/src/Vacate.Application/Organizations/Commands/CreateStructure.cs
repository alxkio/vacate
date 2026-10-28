using Vacate.Application.Common;

namespace Vacate.Application.Organizations.Commands;

public sealed record CreateStructure(Guid OrganizationGuid, StructureKind Kind, string Name, Guid? DepartmentId = null);

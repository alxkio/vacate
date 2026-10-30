using Vacate.Application.Common;

namespace Vacate.Application.Organizations.Commands;

public sealed record UpdateStructure(Guid OrganizationGuid, StructureKind Kind, Guid Guid, Change<string> Name = default,
    Change<Guid?> DepartmentId = default, Change<bool?> RequireVacationApproval = default);

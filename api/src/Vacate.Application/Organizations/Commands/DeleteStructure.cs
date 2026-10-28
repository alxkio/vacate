using Vacate.Application.Common;

namespace Vacate.Application.Organizations.Commands;

public sealed record DeleteStructure(Guid OrganizationGuid, StructureKind Kind, Guid Guid);

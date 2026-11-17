namespace Vacate.Application.Organizations.Commands;

public sealed record RequestStructureDeletion(Guid OrganizationGuid, StructureKind Kind, Guid Guid);

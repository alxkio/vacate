namespace Vacate.Application.Memberships.Commands;

public sealed record UpdateMembership(Guid CompanyGuid, Guid UserGuid, MembershipChanges Changes);

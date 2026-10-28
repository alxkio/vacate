namespace Vacate.Application.Memberships.Commands;

public sealed record CreateMembership(Guid CompanyGuid, Guid UserGuid, MembershipChanges Changes);

namespace Vacate.Application.Memberships.Commands;

public sealed record RequestMembershipDeletion(Guid CompanyGuid, Guid UserGuid);

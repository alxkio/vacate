namespace Vacate.Application.Memberships.Commands;

public sealed record DeleteMembership(Guid CompanyGuid, Guid UserGuid);

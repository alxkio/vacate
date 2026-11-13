using Vacate.Application.Abstractions;
using Vacate.Application.Leave;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;

namespace Vacate.Infrastructure.Persistence;

// Shared tracked aggregate storage and transaction gate. Swap repository adapters for durable storage later.
public sealed class InMemoryDatabase
{
    internal Dictionary<(int CompanyId, int MembershipId, Guid Key), string> CoveredReceipts { get; } = [];
    internal List<StoredLeaveRequest> LeaveRequests { get; } = [];
    internal List<(int CompanyId, int MembershipId, LeaveEntitlement Entitlement)> LeaveEntitlements { get; } = [];
    internal List<(string CountryCode, DateOnly Date, string Name)> PublicHolidays { get; } = [];
    internal Dictionary<int, CompanyCalendarState> CompanyCalendars { get; } = [];
    internal object Gate { get; } = new();
    internal Dictionary<int, User> Users { get; } = [];
    internal List<Membership> Memberships { get; } = [];
    internal Dictionary<int, Organization> Organizations { get; } = [];
    internal List<RoleReference> JobRoles { get; } = [];
    internal List<RoleReference> WorkSchedules { get; } = [];
    internal Dictionary<int, int> Invitations { get; } = [];

    internal HashSet<(int UserId, int OrganizationId)> ProvisioningGrants { get; } = [];
    internal Dictionary<int, UserPresentation> Presentation { get; } = [];
    internal Dictionary<string, int> CredentialAliases { get; } = [];

    public InMemoryDatabase(bool seedDevelopmentData = false)
    {
        if (seedDevelopmentData)
        {
            DevelopmentDataSeeder.Apply(this);
        }
    }
}

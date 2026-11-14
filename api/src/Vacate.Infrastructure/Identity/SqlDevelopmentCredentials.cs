using Microsoft.Extensions.Configuration;
using Vacate.Application.Abstractions;
using Vacate.Infrastructure.Persistence.Sql;

namespace Vacate.Infrastructure.Identity;

// Public development credentials require an explicit database login and an active marked test tenant.
// This preserves the existing alias/password convention; it is not production authentication.
internal sealed class SqlDevelopmentCredentials(SqlSession session, IConfiguration configuration) : ICredentialValidator
{
    public bool Enabled => bool.TryParse(configuration["DevelopmentAuthentication:Enabled"], out var enabled) && enabled;

    public int? Validate(string username, string password)
    {
        if (!Enabled)
        {
            return null;
        }

        var normalized = username.Trim().ToLowerInvariant();
        if (password != normalized)
        {
            return null;
        }

        var matches = Candidates().Where(x => x.Alias == normalized || x.Username.ToLowerInvariant() == normalized).Select(x => x.Id).Distinct().ToArray();
        return matches.Length == 1 ? matches[0] : null;
    }

    public IReadOnlyList<DevelopmentAccount> Accounts() => !Enabled ? [] : Candidates().Where(x => x.Advertise)
        .Select(x => new DevelopmentAccount(x.Alias, x.Name, x.Role, x.Team)).ToArray();

    private Candidate[] Candidates() => (
        from login in session.Context.Set<DevelopmentLoginRow>()
        join user in session.Context.Set<UserRow>() on login.UserId equals user.Id
        join member in session.Context.Set<MembershipRow>() on user.Id equals member.UserId
        join company in session.Context.Set<OrganizationRow>() on member.CompanyId equals company.Id
        join team in session.Context.Set<TeamRow>() on member.TeamId equals (int?)team.Id into teams
        from team in teams.DefaultIfEmpty()
        where login.Enabled && company.IsDemo && company.DeletedAt == null && member.DeletedAt == null && user.DeletedAt == null && user.Status == "active"
        select new Candidate(user.Id, login.Alias, login.Advertise, user.Username, user.FirstName + " " + user.LastName, member.SettingsRole, team == null ? "" : team.Name)
    ).ToArray();

    private sealed record Candidate(int Id, string Alias, bool Advertise, string Username, string Name, string Role, string Team);
}

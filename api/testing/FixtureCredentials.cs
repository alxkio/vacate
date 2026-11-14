using Microsoft.Extensions.Configuration;
using Vacate.Application.Abstractions;
using Vacate.Infrastructure.Persistence;

namespace Vacate.Testing;

// Credentials for the disposable test host only; excluded from publish builds.
internal sealed class FixtureCredentials(InMemoryDatabase database, IConfiguration configuration, IUserRepository users, IReadOnlyDictionary<string, int> aliases) : ICredentialValidator
{
    public bool Enabled => bool.TryParse(configuration["DevelopmentAuthentication:Enabled"], out var enabled) && enabled;

    public IReadOnlyList<DevelopmentAccount> Accounts() => !Enabled ? [] : aliases.Select(pair =>
    {
        var user = database.Users[pair.Value];
        var member = database.Memberships.Single(m => m.UserId == user.Id);
        return new DevelopmentAccount(pair.Key, user.Name.FirstName, member.SettingsRole.ToString(),
            database.Organizations[member.CompanyId].Teams.SingleOrDefault(t => t.Id == member.Configuration.TeamId)?.Name ?? "");
    }).ToArray();

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

        var alias = normalized switch
        {
            "user" => "maya",
            "admin" => "nora",
            _ => normalized
        };
        if (aliases.TryGetValue(alias, out var id))
        {
            var expected = database.Users[id];
            return users.FindByGuid(expected.Guid)?.Id;
        }

        var expectedGuids = database.Users.Values.Where(u => aliases.Values.Contains(u.Id)).Select(u => u.Guid).ToHashSet();
        return users.All().FirstOrDefault(u => u.Username == normalized && expectedGuids.Contains(u.Guid))?.Id;
    }
}

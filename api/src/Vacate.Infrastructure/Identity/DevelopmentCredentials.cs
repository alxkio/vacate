using Microsoft.Extensions.Configuration;
using Vacate.Application.Abstractions;
using Vacate.Infrastructure.Persistence;

namespace Vacate.Infrastructure.Identity;

// Explicit development adapter for seeded fictional accounts; not a production identity provider.
public sealed class DevelopmentCredentials(InMemoryDatabase database, IConfiguration configuration, IUserRepository users) : ICredentialValidator
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

        var alias = normalized switch
        {
            "user" => "maya",
            "admin" => "nora",
            _ => normalized
        };
        if (database.CredentialAliases.TryGetValue(alias, out var id))
        {
            var expected = database.Users[id];
            return users.FindByGuid(expected.Guid)?.Id;
        }

        var expectedGuids = database.Users.Values.Where(u => database.CredentialAliases.ContainsValue(u.Id)).Select(u => u.Guid).ToHashSet();
        return users.All().FirstOrDefault(u => u.Username == normalized && expectedGuids.Contains(u.Guid))?.Id;
    }
}

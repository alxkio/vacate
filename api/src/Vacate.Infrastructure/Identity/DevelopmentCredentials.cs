using Microsoft.Extensions.Configuration;
using Vacate.Application.Abstractions;
using Vacate.Infrastructure.Persistence;

namespace Vacate.Infrastructure.Identity;

// Explicit development adapter for seeded fictional accounts; not a production identity provider.
public sealed class DevelopmentCredentials(InMemoryDatabase database, IConfiguration configuration) : ICredentialValidator
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
            return id;
        }

        return database.Users.Values.FirstOrDefault(u => u.Username == normalized && database.CredentialAliases.ContainsValue(u.Id))?.Id;
    }
}

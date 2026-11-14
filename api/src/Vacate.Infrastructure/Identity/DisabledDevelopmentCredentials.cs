using Vacate.Application.Abstractions;

namespace Vacate.Infrastructure.Identity;

// Ordinary InMemory hosting has no development accounts. Test tooling supplies its own validator.
internal sealed class DisabledDevelopmentCredentials : ICredentialValidator
{
    public bool Enabled => false;

    public int? Validate(string username, string password) => null;
}

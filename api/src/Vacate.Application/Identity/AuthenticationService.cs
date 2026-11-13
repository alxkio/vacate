using Vacate.Application.Abstractions;
using Vacate.Application.Common;

namespace Vacate.Application.Identity;

// Replace the credential/session adapters with the selected OIDC integration; domain services stay unchanged.
public sealed class AuthenticationService(ICredentialValidator credentials, ISessionStore sessions,
    IUserRepository users, IUnitOfWork unitOfWork, RecordMapper mapper, TimeProvider clock)
{
    public SignInResult SignIn(string username, string password) => unitOfWork.Execute(() =>
    {
        if (!credentials.Enabled)
        {
            throw new ServiceException(ServiceError.Unavailable, "Development sign-in is unavailable.");
        }

        var id = credentials.Validate(username, password);
        if (id is null || users.Find(id.Value) is not { CanSignIn: true } user)
        {
            throw new ServiceException(ServiceError.Unauthenticated, "Incorrect development credentials.");
        }

        var ticket = sessions.Issue(user.Id, clock.GetUtcNow().AddMinutes(30));
        return new SignInResult(ticket.AccessToken, ticket.ExpiresAt, mapper.Person(user));
    });

    public int RequireActor(string token) => unitOfWork.Execute(() =>
    {
        var id = sessions.Resolve(token, clock.GetUtcNow());
        if (id is null || users.Find(id.Value)?.CanSignIn != true)
        {
            throw new ServiceException(ServiceError.Unauthenticated, "Sign in to access the API.");
        }

        return id.Value;
    });

    public CurrentSession Current(string token) => unitOfWork.Execute(() =>
    {
        var user = users.Find(RequireActor(token))!;
        return new CurrentSession(mapper.Person(user), mapper.User(user));
    });

    public void SignOut(string token)
    {
        RequireActor(token);
        sessions.Revoke(token);
    }
}

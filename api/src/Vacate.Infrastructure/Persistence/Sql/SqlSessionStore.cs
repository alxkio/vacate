using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Vacate.Application.Abstractions;
using Vacate.Domain.Common;

namespace Vacate.Infrastructure.Persistence.Sql;

internal sealed class SqlSessionStore(SqlSession session, TimeProvider clock) : ISessionStore
{
    private static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    public SessionTicket Issue(int userId, DateTimeOffset expiresAt) => session.Execute(() =>
    {
        var now = clock.GetUtcNow();
        var expiry = expiresAt.ToUniversalTime();
        if (expiry <= now)
        {
            throw new DomainValidationException("Session expiry must be in the future.");
        }

        // Reclaim a bounded batch during successful sign-in; validation never turns a storage failure into expiry.
        var expired = session.Context.Set<SessionRow>().Where(row => row.ExpiresAt <= now)
            .OrderBy(row => row.ExpiresAt).Take(100).ToArray();
        session.Context.RemoveRange(expired);
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        session.Context.Add(new SessionRow
        {
            TokenHash = Hash(token),
            UserId = userId,
            CreatedAt = now,
            ExpiresAt = expiry
        });
        return new SessionTicket(token, expiry);
    });

    public int? Resolve(string token, DateTimeOffset now) => session.Execute(() =>
    {
        var hash = Hash(token);
        var tracked = session.Context.ChangeTracker.Entries<SessionRow>().SingleOrDefault(entry => entry.Entity.TokenHash == hash);
        if (tracked is not null)
        {
            return tracked.State != EntityState.Deleted && tracked.Entity.ExpiresAt > now ? (int?)tracked.Entity.UserId : null;
        }

        return session.Context.Set<SessionRow>().Where(row => row.TokenHash == hash && row.ExpiresAt > now)
            .Select(row => (int?)row.UserId).SingleOrDefault();
    });

    public void Revoke(string token) => session.Execute(() =>
    {
        var hash = Hash(token);
        DiscardTrackedTickets(row => row.TokenHash == hash);
        return session.Context.Set<SessionRow>().Where(row => row.TokenHash == hash).ExecuteDelete();
    });

    public void RevokeForUser(int userId) => session.Execute(() =>
    {
        DiscardTrackedTickets(row => row.UserId == userId);
        return session.Context.Set<SessionRow>().Where(row => row.UserId == userId).ExecuteDelete();
    });

    private void DiscardTrackedTickets(Func<SessionRow, bool> matches)
    {
        // Bulk deletion must also cancel tickets issued earlier in this uncommitted use case.
        foreach (var entry in session.Context.ChangeTracker.Entries<SessionRow>().Where(entry => matches(entry.Entity)).ToArray())
        {
            entry.State = EntityState.Detached;
        }
    }
}

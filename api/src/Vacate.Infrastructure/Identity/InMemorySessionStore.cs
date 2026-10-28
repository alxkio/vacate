using System.Security.Cryptography;
using Vacate.Application.Abstractions;

namespace Vacate.Infrastructure.Identity;

public sealed class InMemorySessionStore : ISessionStore
{
    private readonly object gate = new();

    private readonly Dictionary<string, (int UserId, DateTimeOffset ExpiresAt)> sessions = [];

    private static string Hash(string token) => Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)));

    public SessionTicket Issue(int userId, DateTimeOffset expiresAt)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        lock (gate)
        {
            sessions[Hash(token)] = (userId, expiresAt);
        }

        return new(token, expiresAt);
    }

    public int? Resolve(string token, DateTimeOffset now)
    {
        lock (gate)
        {
            var key = Hash(token);
            if (sessions.TryGetValue(key, out var session) && session.ExpiresAt > now)
            {
                return session.UserId;
            }

            sessions.Remove(key);
            return null;
        }
    }

    public void RevokeForUser(int userId)
    {
        lock (gate)
        {
            foreach (var key in sessions.Where(x => x.Value.UserId == userId).Select(x => x.Key).ToArray())
            {
                sessions.Remove(key);
            }
        }
    }

    public void Revoke(string token)
    {
        lock (gate)
        {
            sessions.Remove(Hash(token));
        }
    }
}

namespace Vacate.Domain.Common;

public abstract class Entity(int id, Guid guid, DateTimeOffset createdAt)
{
    public int Id { get; } = id > 0 ? id : throw new DomainValidationException("ID must be positive.");
    public Guid Guid { get; } = guid != System.Guid.Empty ? guid : throw new DomainValidationException("A GUID is required.");
    public DateTimeOffset CreatedAt { get; } = createdAt.ToUniversalTime();
    public DateTimeOffset UpdatedAt { get; private set; } = createdAt.ToUniversalTime();
    public DateTimeOffset? DeleteRequestedAt { get; private set; }
    public DateTimeOffset? DeletedAt { get; private set; }
    public bool IsDeleted => DeletedAt is not null;

    protected void Touch(DateTimeOffset now)
    {
        if (IsDeleted)
        {
            throw new DomainConflictException("A deleted record cannot be changed.");
        }

        UpdatedAt = now.ToUniversalTime();
    }

    protected void RequestDeletionCore(DateTimeOffset now)
    {
        Touch(now);
        DeleteRequestedAt ??= now.ToUniversalTime();
    }

    protected void DeleteCore(DateTimeOffset now)
    {
        RequestDeletionCore(now);
        DeletedAt = now.ToUniversalTime();
    }
}

public abstract class AggregateRoot(int id, Guid guid, DateTimeOffset createdAt) : Entity(id, guid, createdAt)
{
    public void RequestDeletion(DateTimeOffset now) => RequestDeletionCore(now);

    public virtual void Delete(DateTimeOffset now) => DeleteCore(now);
}

public sealed class DomainValidationException(string message) : Exception(message);
public sealed class DomainConflictException(string message) : Exception(message);
public static class DomainValue
{
    public static string Name(string? value, string field)
    {
        var result = value?.Trim();
        if (string.IsNullOrEmpty(result) || result.Length > 200)
        {
            throw new DomainValidationException($"Enter a valid {field} (maximum 200 characters).");
        }

        return result;
    }
}

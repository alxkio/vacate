namespace Vacate.Application.Common;

public readonly record struct Change<T>(bool IsSpecified, T Value)
{
    public T Or(T current) => IsSpecified ? Value : current;
}

public enum ServiceError
{
    NotFound, Forbidden, Unauthenticated, Conflict, Unavailable
}

public sealed class ServiceException(ServiceError kind, string message) : Exception(message)
{
    public ServiceError Kind { get; } = kind;
}

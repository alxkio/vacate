using System.Net.Mail;
using Vacate.Domain.Common;

namespace Vacate.Domain.Users;

public sealed record PersonName
{
    public string FirstName { get; }
    public string? MiddleName { get; }
    public string LastName { get; }

    public PersonName(string firstName, string? middleName, string lastName)
    {
        FirstName = DomainValue.Name(firstName, "first name");
        LastName = DomainValue.Name(lastName, "last name");
        MiddleName = string.IsNullOrWhiteSpace(middleName) ? null : DomainValue.Name(middleName, "middle name");
    }
}

public sealed record FamilyInformation
{
    public bool Married { get; }
    public int DependentChildren { get; }
    public bool SoleCare { get; }

    public FamilyInformation(bool? married = false, int? dependentChildren = 0, bool? soleCare = false)
    {
        Married = married ?? false;
        DependentChildren = dependentChildren ?? 0;
        SoleCare = soleCare ?? false;
        if (DependentChildren < 0)
        {
            throw new DomainValidationException("Dependent children must be a whole number of zero or more.");
        }

        if (Married && SoleCare)
        {
            throw new DomainValidationException("Married and sole care cannot both be selected.");
        }
    }
}

public sealed class User : AggregateRoot
{
    public string Username { get; private set; }
    public PersonName Name { get; private set; }
    public string Gender { get; private set; }
    public FamilyInformation Family { get; private set; }
    public string Status { get; private set; } = "active";
    public bool CanSignIn => !IsDeleted && Status == "active";

    public User(int id, Guid guid, string username, PersonName name, string gender,
        FamilyInformation family, DateTimeOffset now) : base(id, guid, now)
    {
        Username = NormalizeUsername(username);
        Name = name;
        Gender = ValidateGender(gender);
        Family = family;
    }

    public static User Restore(int id, Guid guid, string username, PersonName name, string gender,
        FamilyInformation family, string status, EntityLifecycle lifecycle)
    {
        var user = new User(id, guid, username, name, gender, family, lifecycle.CreatedAt);
        user.UpdateAccount(username, status, lifecycle.UpdatedAt);
        user.RestoreLifecycle(lifecycle);
        return user;
    }

    public static string NormalizeUsername(string username)
    {
        var value = DomainValue.Name(username, "email username").ToLowerInvariant();
        if (!MailAddress.TryCreate(value, out var email) || email.Address != value)
        {
            throw new DomainValidationException("Enter an email username.");
        }

        return value;
    }

    private static string ValidateGender(string gender) => gender is "woman" or "man" or "unspecified"
        ? gender : throw new DomainValidationException("Choose a gender option.");

    public void UpdateProfile(PersonName name, string gender, FamilyInformation family, DateTimeOffset now)
    {
        var validGender = ValidateGender(gender);
        Touch(now);
        Name = name;
        Gender = validGender;
        Family = family;
    }

    public void UpdateAccount(string username, string status, DateTimeOffset now)
    {
        var normalized = NormalizeUsername(username);
        if (status is not ("active" or "disabled"))
        {
            throw new DomainValidationException("Unknown account status.");
        }

        Touch(now);
        Username = normalized;
        Status = status;
    }
}

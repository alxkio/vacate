namespace Vacate.Application.Users.Commands;

public sealed record CreateUser(string Username, string FirstName, string? MiddleName, string LastName,
    string Gender = "unspecified", bool? Married = false, int? DependentChildren = 0, bool? SoleCare = false, Guid? CompanyId = null);

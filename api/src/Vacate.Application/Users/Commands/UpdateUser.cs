using Vacate.Application.Common;

namespace Vacate.Application.Users.Commands;

public sealed record UpdateUser(Guid Guid, Change<string> FirstName = default, Change<string?> MiddleName = default,
    Change<string> LastName = default, Change<string> Gender = default, Change<bool?> Married = default,
    Change<int?> DependentChildren = default, Change<bool?> SoleCare = default);

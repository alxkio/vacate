using Vacate.Application.Common;

namespace Vacate.Application.Users.Commands;

public sealed record UpdateUserAccount(Guid Guid, Change<string> Username = default, Change<string> Status = default);

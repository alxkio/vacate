namespace Vacate.Domain.Leave;

public static class LeaveLifecycle
{
    public static bool CanCancel(string status, DateOnly date, DateOnly today) =>
        date >= today && status is "Approved" or "Pending";

    public static bool IsExpired(string status, DateOnly date, DateOnly today) =>
        status == "Pending" && date < today;
}

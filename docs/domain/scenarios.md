# Domain scenarios

**Status:** PROPOSED

## Leave request lifecycle

1. Employee selects leave type and date/time range.
2. System resolves the employee’s work schedule, holiday calendar, entitlement ledger, leave policy, and approval policy.
3. System calculates requested units and explains the result.
4. On submit, the system atomically creates the request, snapshots the applicable policy/approvers, reserves balance where the policy requires it, and writes an outbox event.
5. An approver accepts or rejects according to the snapshotted policy. The final decision creates a ledger movement and notification.
6. Cancellation/amendment follows an explicit policy; it never silently rewrites history.

## Invariants

- A request belongs to one tenant and one employment relationship.
- A final approval must be authorised by the request’s snapshotted approval policy.
- Entitlement cannot be overdrawn unless an explicitly configured policy permits it.
- Balance reservation and final deduction must be concurrency-safe.
- A viewer may only see the least information their visibility grant permits.
- Every policy, balance, and approval change is attributable, timestamped, and auditable.

## Scenarios requiring a decision

- One employee belongs to two teams with different managers. Which team determines approvers and coverage?
- A person works part-time or has different work schedules by day. What unit is requested: days, hours, or both?
- A request crosses a year or a policy effective-date boundary. Which entitlement applies?
- A manager is absent. Is delegation required for MVP?
- An individual visibility grant conflicts with a team-level restriction. Which rule wins?


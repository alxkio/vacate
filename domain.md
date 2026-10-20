# Historical domain reference

**Status: SUPERSEDED / UNVERIFIED.** Retained for context only. Use docs/product/product-charter.md, docs/product/mvp-scope.md and docs/domain/ for current direction. Country rules below have no approved policy-source register; do not implement them. Hierarchy, membership and cancellation descriptions conflict internally.

# Vacate Domain Knowledge

**Product:** Vacation tracking SaaS for EU SMBs (20–1500 employees)  
**Domain Focus:** Leave management, approval workflows, organizational hierarchy, EU compliance  
**Last Updated:** June 2026

---

## Table of Contents

1. [Core Domain Concepts](#core-domain-concepts)
2. [Bounded Contexts](#bounded-contexts)
3. [Organization Hierarchy](#organization-hierarchy)
4. [Leave Management](#leave-management)
5. [Approval Workflows](#approval-workflows)
6. [Role-Based Access & Visibility](#role-based-access--visibility)
7. [EU Leave Law Defaults](#eu-leave-law-defaults)
8. [Domain Events](#domain-events)
9. [Business Rules & Policies](#business-rules--policies)
10. [GDPR & Compliance](#gdpr--compliance)

---

## Core Domain Concepts

### Key Entities

#### Organization
- **Definition:** The top-level entity representing a company using Vacate
- **Attributes:**
  - `id` (UUID) — unique identifier
  - `name` — company legal name
  - `country` — primary country for leave law defaults
  - `timezone` — for business hour calculations
  - `created_at`, `updated_at` — audit timestamps
- **Behaviors:**
  - Initialize with country-specific leave law rules
  - Define root hierarchy node (organization level)

#### Department
- **Definition:** A division or functional area within an organization
- **Attributes:**
  - `id` (UUID)
  - `organization_id` (FK)
  - `parent_department_id` (FK) — for nested departments (optional)
  - `name` — e.g., "Engineering", "HR", "Finance"
  - `manager_id` (FK) — user with manager role for this department
- **Behaviors:**
  - Can have child departments (recursion)
  - Manager visibility scoped to their department and children

#### Team
- **Definition:** A group within a department, usually smallest approval unit
- **Attributes:**
  - `id` (UUID)
  - `organization_id` (FK)
  - `department_id` (FK)
  - `name` — e.g., "Backend Team", "Frontend Team"
  - `manager_id` (FK) — team lead/manager
  - `minimum_coverage` (int) — minimum team members required on a given day
- **Behaviors:**
  - Team lead can view/approve all team members' leave
  - Conflict detection: alert if approval would breach `minimum_coverage`

#### User
- **Definition:** A person using the system (employee, manager, admin)
- **Attributes:**
  - `id` (UUID)
  - `organization_id` (FK)
  - `email` — unique within organization
  - `first_name`, `last_name`
  - `job_title`
  - `department_id` (FK)
  - `team_id` (FK)
  - `roles` — list of role IDs (Employee, Manager, HR, Admin) — see Role-Based Access section
  - `manager_id` (FK) — direct manager for leave approvals
  - `created_at`, `updated_at`
- **Behaviors:**
  - User has one or more roles
  - Claim-based authorization: includes `org_id`, `team_id`, `dept_id`, `roles` in JWT

#### LeaveType
- **Definition:** Category of leave (vacation, sick, unpaid, parental, etc.)
- **Attributes:**
  - `id` (UUID)
  - `organization_id` (FK)
  - `name` — e.g., "Vacation", "Sick Leave"
  - `requires_manager_approval` (boolean)
  - `is_paid` (boolean)
  - `color` (hex) — for calendar visualization
  - `created_at`
- **Behaviors:**
  - Organization can create custom leave types (min 5 default types)
  - Some leave types bypass approval (e.g., sick leave may auto-approve)

---

## Bounded Contexts

### 1. Leave Management Context

**Responsibility:** Manage leave requests, balances, and entitlements

**Key Entities:**
- LeaveRequest (aggregate root)
- LeaveBalance
- LeaveEntitlement
- LeaveAllocation (yearly reset)

**Core Concepts:**

#### LeaveRequest (Aggregate Root)
- **Definition:** A request by an employee to take time off
- **Attributes:**
  - `id` (UUID)
  - `organization_id`, `user_id` (FK)
  - `leave_type_id` (FK)
  - `start_date`, `end_date` — inclusive date range
  - `business_days_requested` (calculated) — excludes weekends, holidays
  - `status` — enum: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELLED`
  - `created_at`, `submitted_at`, `approved_at`, `rejected_at`
  - `rejection_reason` (nullable)
  - `created_by`, `last_updated_by` (user IDs)

**State Machine:**
```
DRAFT → SUBMITTED → APPROVED → (leave taken)
           ↓
        REJECTED
```

**Invariants (Business Rules):**
1. Start date ≤ End date
2. setting to allow submit leave for past dates (except same day, determined by timezone)
3. Requested days must not exceed available balance
4. If `leave_type.requires_manager_approval`, must route through approval chain
5. Once `APPROVED`, cannot change dates or cancel (only admin can)
6. Cannot have overlapping approved leave

**Behaviors:**
- `submit()` — transition to SUBMITTED, validate balance, trigger approval workflow
- `approve()` — transition to APPROVED, deduct from balance, send notification
- `reject(reason)` — transition to REJECTED, restore any tentative balance deductions, send notification
- `cancel()` — transition to CANCELLED (if not yet started)

#### LeaveBalance (Value Object)
- **Definition:** Current balance of a specific leave type for a user in a year
- **Attributes:**
  - `user_id`, `leave_type_id`, `year` (composite key)
  - `entitlement_days` (decimal) — annual allocation
  - `used_days` (decimal) — approved leave days this year
  - `pending_days` (decimal) — submitted but not yet approved
  - `available_days` (calculated) — `entitlement_days - used_days - pending_days`
  - `carryover_days` (decimal) — days rolled from prior year (if allowed by law)
- **Behaviors:**
  - `canRequestDays(n)` — returns true if `available_days >= n`
  - `deductDays(n)` — reduce `used_days`, recalculate `available_days`
  - `addPendingDays(n)` — increase `pending_days` on submission
  - `removePendingDays(n)` — decrease `pending_days` on rejection

#### LeaveEntitlement (Value Object)
- **Definition:** Annual leave entitlement based on country law and contract
- **Attributes:**
  - `user_id`, `year` (composite key)
  - `vacation_days` (decimal) — minimum per EU Working Time Directive (4 weeks = 20 days for 5-day week)
  - `sick_days` (decimal)
  - `unpaid_days` (decimal)
  - `parental_days` (decimal)
  - `carryover_allowed` (boolean) — per country law
  - `carryover_max_days` (decimal) — max days carried to next year
  - `expiry_date` (nullable) — when unused days are lost
- **Source:** Calculated from country law defaults + organization customizations

### 2. Organization Context

**Responsibility:** Manage organizational structure, hierarchy, and access scopes

**Key Entities:**
- Organization (aggregate root)
- Department
- Team
- Role
- Permission

**Core Concepts:**

#### Organizational Hierarchy

A multi-level structure: **Organization → Departments (nested) → Teams → Users**

**Example Structure:**
```
Acme Corp (Organization)
├── Engineering (Department)
│   ├── Backend Team (Team)
│   │   ├── Alice (User, Team Lead)
│   │   ├── Bob (User)
│   │   └── Carol (User)
│   └── Frontend Team (Team)
│       ├── David (User, Team Lead)
│       └── Eve (User)
└── Finance (Department)
    ├── Accounting Team (Team)
    │   ├── Frank (User, Team Lead)
    │   └── Grace (User)
    └── Planning Team (Team)
        └── Henry (User, Manager)
```

**Hierarchy Rules:**
1. A user belongs to exactly one team
2. A team belongs to exactly one department
3. A department can have parent department (nested orgs)
4. Department managers can have visibility of sub-departments

---

## Leave Management

### Leave Request Lifecycle

```
Employee creates request (DRAFT)
    ↓
Employee submits (SUBMITTED)
    ↓ [Enters approval queue]
Manager 1 reviews → Approves or Rejects
    ↓ [If approved, proceeds to next level]
Manager 2 reviews → Approves or Rejects
    ↓ [If approved, proceeds to HR if needed]
HR reviews (optional) → Final approval or rejection
    ↓ [If approved]
APPROVED state — deduct days from balance, user notified, calendar updated
```

### Leave Balance Calculation

**Formula:**
```
Available Balance = Entitlement Days - Used Days - Pending Days - Minimum Threshold
```

**Example (EU Default: 20 vacation days):**
- Entitlement: 20 days
- Used (approved leave): 8 days
- Pending (submitted, awaiting approval): 3 days
- Available: 20 - 8 - 3 = 9 days

**Real-Time Display:**
When user is submitting a request for 5 days, the system shows:
- "You will have 4 days left after this leave" (showing post-approval state)

### Carryover Rules

**Defined per-country:**
- France: No carryover (must take RTT in same year)
- Germany: 20 days carryover into Feb (per collective agreement)
- Netherlands: Up to 5 days carryover (determined by contract)
- Spain: Generally no carryover
- Italy: Limited carryover per collective agreement

---

## Approval Workflows

### Multi-Level Approval Chains

**Core Concept:** A leave request can require approval from multiple managers at different organizational levels

**Example Workflow (3-level approval):**

1. **Team Lead** (Level 1)
   - Approves/rejects team member requests
   - Can see: only their team's requests
   
2. **Department Manager** (Level 2)
   - Reviews only if team lead approves
   - Can see: all dept and sub-dept requests
   
3. **HR Manager** (Level 3, optional)
   - Final sign-off for compliance/balance checks
   - Can see: all requests in organization

**State per Approver:**
- `PENDING_AT_LEVEL_1` — awaiting team lead
- `PENDING_AT_LEVEL_2` — team lead approved, awaiting dept manager
- `PENDING_AT_LEVEL_3` — dept manager approved, awaiting HR
- `APPROVED` — all levels approved
- `REJECTED_AT_LEVEL_X` — rejected at specific level

**Configuration:**
- Org admin defines approval chain depth (1, 2, or 3 levels)
- Each leave type can have different approval requirements
- Critical leave (>5 days) might require HR even if normal leave doesn't

#### ApprovalQueue (Value Object)
- **Definition:** The list of pending approvals for a specific user/role
- **Attributes:**
  - `approver_id` (user ID)
  - `pending_requests[]` — list of LeaveRequest IDs awaiting their approval
  - `total_pending` (count)
- **Behaviors:**
  - `getApprovalRequests()` — sorted by submission date (FIFO)
  - `approveRequest(request_id, comment)` — move to next level
  - `rejectRequest(request_id, reason)` — back to REJECTED
  - `getTeamCalendar()` — show which team members are off (for approval context)

---

## Role-Based Access & Visibility

### Role Definitions

| Role | Permissions | Visible Data |
|------|-----------|--------------|
| **Employee** | Submit leave requests, view own balance, view team calendar (who's off) | Own requests, own balance, team members (first/last name only) |
| **Team Lead** | + Approve/reject team requests, see team's balance overview | Team members' requests, team members' names/emails, org hierarchy (own dept) |
| **Department Manager** | + Approve at dept level, see cross-team coverage conflicts | All dept and sub-dept requests, dept org chart, conflicts across team |
| **HR Manager** | + Final approvals, override balances, GDPR data access, analytics | All organization requests, all user data, audit logs |
| **Admin** | Full system access including settings, leave type config, org hierarchy | Everything |

### Claim-Based Authorization

**JWT Claims Example:**
```json
{
  "sub": "user-123",
  "org_id": "org-456",
  "team_id": "team-789",
  "dept_id": "dept-101",
  "roles": ["employee", "team_lead"],
  "managed_teams": ["team-789"],
  "managed_depts": ["dept-101"]
}
```

**Authorization Logic (Pseudo-code):**
```
canApproveRequest(request):
  if request.team_id in claims.managed_teams:
    return true  # Team lead of this team
  if request.dept_id in claims.managed_depts:
    return true  # Department manager
  if "hr_manager" in claims.roles:
    return true  # HR can approve anything
  return false
```

### Scope-Based Visibility (KEY DIFFERENTIATOR)

**Problem:** Standard RBAC doesn't prevent team leads from seeing other teams' data.

**Solution:** Role + Scope + Department/Team combination

**Example:**
- Alice = Team Lead of Backend Team in Engineering
- Can see: Only Backend Team members' leave requests
- Cannot see: Frontend Team, Finance team requests
- Org chart: Can drill down from Engineering → sees sub-teams under Engineering only

**Implementation:**
- Every API endpoint checks: `(request.user_roles INTERSECT required_roles) AND (request.scope_user_id IN accessible_user_ids)`
- `accessible_user_ids` calculated from org hierarchy at request time

---

## EU Leave Law Defaults

### Per-Country Rules

All values are **per calendar year** unless noted otherwise.

#### France
- **Vacation:** 25 days (5 weeks per Working Time Directive + 5 RTT days)
- **Sick:** 3 days paid, indefinite unpaid
- **Parental:** 14 weeks (mother) / 4 weeks (father/co-parent)
- **Carryover:** RTT must be taken in same year; unused carryover lost
- **Holiday:** 11 statutory holidays (fixed dates + Easter Monday + Whit Monday)

#### Germany
- **Vacation:** 20 days minimum (4 weeks per BUrlG law)
- **Sick:** 6 weeks paid (per Gesetz zur Entgeltfortzahlung)
- **Parental:** Up to 3 years (per Bundeselterngeld- und Elternzeitgesetz)
- **Carryover:** 20 days can carry into February; any unused past Feb 28 forfeited
- **Holiday:** 9–10 statutory holidays (varies by state/Bundesland)

#### Spain
- **Vacation:** 30 days minimum (6 weeks)
- **Sick:** 3 days per year (paid by company)
- **Carryover:** Generally not permitted; must be taken in same year
- **Holiday:** 14 statutory holidays

#### Netherlands
- **Vacation:** 20 days minimum (4 weeks)
- **Sick:** First 2 days paid by employer; 3rd+ covered by illness insurance
- **Carryover:** Up to 5 days can carry over (per employment contract)
- **Holiday:** 8 statutory holidays (fixed dates)

#### Italy
- **Vacation:** 20 days minimum + 4 statutory holidays
- **Sick:** First 3 days at 66% pay, then full pay (funded by insurance)
- **Carryover:** Limited per collective agreement (typically 5 days max)
- **Holiday:** 12 statutory holidays

#### Belgium
- **Vacation:** 20 days
- **Sick:** Covered by social insurance after 1st day
- **Carryover:** 5 days can carry to next year
- **Holiday:** 10 statutory holidays

### Configuration in System

Each organization specifies:
1. **Country** — triggers default leave law rules
2. **Customizations** (optional):
   - Increase vacation days (e.g., 25 instead of 20)
   - Add extra holidays
   - Modify carryover policy

**Database Table:**
```
leave_entitlements
├── organization_id
├── country_code (e.g., "FR", "DE", "ES")
├── year
├── vacation_days
├── sick_days
├── parental_days
├── carryover_allowed
├── carryover_max_days
├── statutory_holidays[]
└── last_updated_at
```

---

## Domain Events

Events represent significant state changes. Used for:
- **Audit trail** (immutable log of what happened)
- **Notifications** (trigger email, Slack, push notification)
- **Analytics** (track request submission rate, approval rate, etc.)
- **Event Sourcing** (v1.1 feature: rebuild state from events)

### Event Types

#### LeaveRequestSubmitted
```
{
  event_id: UUID,
  aggregate_id: leave_request_id,
  event_type: "LeaveRequestSubmitted",
  timestamp: ISO8601,
  user_id: submitter,
  data: {
    organization_id,
    leave_type,
    start_date,
    end_date,
    business_days_requested,
    approval_chain: ["manager_id_1", "manager_id_2"]
  }
}
```
**Triggers:** Notification to first approver, add to approval queue

#### LeaveRequestApproved
```
{
  event_id: UUID,
  aggregate_id: leave_request_id,
  event_type: "LeaveRequestApproved",
  timestamp: ISO8601,
  approver_id: manager who approved,
  data: {
    organization_id,
    approval_level: 1 or 2 or 3,
    next_approver_id: (if not final),
    comment: (optional)
  }
}
```
**Triggers:** 
- If not final level: notification to next approver
- If final level: deduct days from balance, notify employee, update calendar

#### LeaveRequestRejected
```
{
  event_id: UUID,
  aggregate_id: leave_request_id,
  event_type: "LeaveRequestRejected",
  timestamp: ISO8601,
  approver_id: manager who rejected,
  data: {
    organization_id,
    rejection_reason,
    rejection_level: 1 or 2 or 3
  }
}
```
**Triggers:** Notify employee with reason, allow resubmission

#### LeaveBalanceUpdated
```
{
  event_id: UUID,
  aggregate_id: leave_balance_id,
  event_type: "LeaveBalanceUpdated",
  timestamp: ISO8601,
  user_id,
  data: {
    organization_id,
    leave_type,
    previous_available,
    new_available,
    change_reason: "approval" | "carryover_reset" | "admin_adjustment"
  }
}
```
**Triggers:** No immediate action (informational for audit)

#### YearlyLeaveReset (Scheduled Job)
```
{
  event_id: UUID,
  event_type: "YearlyLeaveReset",
  timestamp: ISO8601,
  data: {
    organization_id,
    year,
    affected_users: [user_id, ...],
    carryover_applied: {user_id: carryover_days, ...}
  }
}
```
**Triggers:** Once per year (Jan 1), process carryover rules, refresh balances

---

## Business Rules & Policies

### Invariant: Cannot Have Overlapping Approved Leave

**Rule:** A user cannot have two approved leave requests with overlapping dates.

**Implementation:**
```
PRE-CONDITION on LeaveRequest.submit():
  SELECT * FROM leave_requests 
  WHERE user_id = this.user_id 
    AND status = 'APPROVED'
    AND start_date <= this.end_date 
    AND end_date >= this.start_date
  IF rows > 0 THEN
    THROW OverlapException("Conflict with existing leave")
```

### Invariant: Balance Cannot Go Negative

**Rule:** User can only request days if available balance ≥ requested days.

**Implementation:**
```
PRE-CONDITION on LeaveRequest.submit():
  IF this.business_days_requested > calculated_available_balance:
    THROW InsufficientBalanceException()
```

### Invariant: Minimum Team Coverage

**Rule:** If team has `minimum_coverage = 3`, cannot approve leave that would leave < 3 on any given day.

**Implementation:**
```
PRE-CONDITION on LeaveRequest.approve():
  FOR each day in [start_date, end_date]:
    in_office_count = COUNT(approved leave on this day for this team)
    total_team = COUNT(users in this team)
    available_count = total_team - in_office_count - 1 (for this request)
    IF available_count < team.minimum_coverage:
      WARN_APPROVER("Team coverage would drop below minimum")
      (allow override by manager)
```

### Policy: Sick Leave Auto-Approval (Per Org Preference)

**Rule:** Some orgs may allow sick leave to auto-approve without manager sign-off.

**Configuration:**
```
leave_types
├── name: "Sick Leave"
├── requires_manager_approval: false  ← auto-approve
├── can_be_submitted_retroactively: true
```

### Policy: Future-Dated Leave Only (Default)

**Rule:** Normally cannot submit leave for past dates; some orgs allow retroactive sick leave (max 3 days back).

**Configuration:**
```
organization_settings
├── allow_retroactive_sick_leave: true
├── retroactive_sick_max_days_back: 3
```

### Policy: Approval Window

**Rule:** Managers should approve/reject within 5 business days. After 7 days, auto-escalate or notify admin.

**Implementation:**
```
SCHEDULED_JOB (runs daily):
  FOR each pending approval > 7 days old:
    SEND email reminder to approver
    IF > 10 days old:
      ESCALATE to next level or HR manager
```

---

## GDPR & Compliance

### Data Residency

- **Primary Database:** Azure SQL Database (EU West Europe region)
- **All PII stored in EU:** No cross-border transfer of user data
- **Backups:** Stored in EU regions only
- **No CDN for PII:** Only static assets (CSS, JS) cached outside EU

### Right to be Forgotten

**Scope:** User requests deletion → all personal data removed within 30 days.

**Implementation:**
```
POLICY:
  - Delete user record (soft delete with anonymization)
  - Anonymize leave requests (replace name with "Deleted User")
  - Keep audit trail (timestamps, actions) but anonymize user reference
  - Delete from all backups after 30-day retention
  - Export data first for user's records
```

### Data Portability

**Scope:** User can export their data in standard format (JSON).

**Includes:**
- Leave request history
- Leave balance history
- Personal profile
- Notifications received

### Audit Logs

**What's logged:**
- User login (timestamp, IP)
- Leave request created/updated/approved/rejected (by whom, when)
- Balance changes (reason: approval, carryover, admin)
- Access to data (user viewing whose data, when)
- Exports requested (user, date, format)

**Retention:** Minimum 3 years (per EU GDPR recommendations for employment)

**Access:** Only HR managers and admins can view audit logs

### Consent & Cookies

- **Login Consent:** User must agree to leave policy on first login
- **Analytics Opt-In:** Optional, defaults to off
- **Cookie Consent:** No tracking cookies; only essential session cookies

---

## Aggregate Patterns & Invariants

### Aggregate: LeaveRequest
- **Root:** LeaveRequest entity
- **Children:** None (LeaveRequest is simple)
- **Invariants:**
  - Status transitions only follow defined state machine
  - Dates are always valid (start ≤ end)
  - Balance check before approval
  - Cannot modify after approval

### Aggregate: Organization
- **Root:** Organization entity
- **Children:** Departments, Teams, LeaveTypes, Users (via hierarchy)
- **Invariants:**
  - Org has exactly one root department (for hierarchy purposes)
  - All users belong to exactly one team
  - All teams belong to exactly one department
  - Circular department references not allowed

---

## Context Mapping

### Leave Management Context → Organization Context

**Interaction:** When approving a leave request, the Leave Management context queries the Organization context to:
- Fetch the approval chain (who approves this user?)
- Verify the user's scope (team, dept, org)
- Get minimum coverage for the team

**Anti-Corruption Layer:** LeaveRequest keeps a denormalized copy of:
- `approver_chain[]` — so we don't need to query org if org is changed post-approval

---

## Glossary

| Term | Definition |
|------|-----------|
| **Entitlement** | Annual statutory leave allocation per law (e.g., 20 vacation days in France) |
| **Balance** | Current available leave days remaining (Entitlement - Used - Pending) |
| **Carryover** | Unused leave days carried into next year (per country law, max limits apply) |
| **RTT (Réduction du Temps de Travail)** | French time-off benefit; must be taken in same year |
| **Working Time Directive** | EU law mandating min 4 weeks paid leave annually (20 days for 5-day week) |
| **Approval Chain** | Sequence of managers who must approve a leave request (e.g., Team Lead → Dept Manager → HR) |
| **Role-Scoped Visibility** | Access control ensuring users only see org hierarchy, requests, balances within their scope |
| **Minimum Coverage** | Minimum number of team members required in office on a given day |
| **Conflict Detection** | System alert when approving leave would violate minimum coverage |
| **Multi-Tenant** | System supports multiple independent organizations; data fully isolated |
| **Claim-Based Auth** | Authorization via JWT claims (roles, team_id, dept_id, org_id) rather than DB lookups |

---

## Future Considerations (v1.1+)

### Event Sourcing Implementation
- Capture all LeaveRequest state changes as immutable events
- Rebuild state by replaying events
- Enables time-travel debugging and compliance audit trails

### Substitute/Delegate Management
- User on leave can designate a colleague to handle approvals ("Acting Manager")
- Useful for multi-level approvals; prevents bottlenecks

### Conflict Alerts & Team Analytics
- "Engineering team has zero coverage on Friday if this is approved"
- Dashboard showing absence patterns, burnout signals (too much leave → burnout risk?)

### Integration with Payroll
- Leave taken → send to payroll system for salary deduction
- API webhook: `POST /integrations/payroll/sync`

### Mobile App Optimizations
- Biometric unlock (Face ID, fingerprint)
- Offline-first: cached team calendar, can submit while offline
- Push notifications for approval requests with deep link




## Additions Edits 

- i want it to focus in the greek market, nordics, and then the ones mentioned above, 
- then teh ability to support bigger orgs (maybe 1000 employees), partnering or coworking orgs, consultants or managed teams on other orgs. 
- employees can belong to more than 1 teams, each team can have a setting for if approval needed or not, for certain vacation types. 
- visibility can be set to individual users as long as under the same hierarchy. 
- option for job roles and rules for roles minimum needed / 
- teams integration with teams app and calendar / notifications etc. 
- users can be part of multiple orgs

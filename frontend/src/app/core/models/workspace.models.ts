export interface Person {
  id: string;
  personId: string;
  companyId: string;
  name: string;
  title: string;
  teamId: string;
  departmentId: string;
  team: string;
  capability: string;
  role: string;
  initials: string;
  username: string;
  email: string;
}
export interface Group {
  id: string;
  name: string;
  companyId: string;
  departmentId?: string;
}
export interface Entry {
  id: string;
  person: string;
  companyId: string;
  start: string;
  end: string;
  type?: string;
  status?: string;
  title?: string;
  amount?: number;
  unit?: string;
}
export interface Allocation {
  allocation: number;
  used: number;
  pending: number;
  period: string;
  note: string;
}
export interface Balance extends Allocation {
  available: number;
  percentage: number | null;
}
export interface LeaveType {
  id: string;
  name: string;
  requestName?: string;
  requestScope?: string;
  group: string;
  unit: string;
  basis: string;
  pay: string;
  shape: string;
  allowance: string;
  rules: string;
  source: string;
  sourceUrl?: string;
}
export interface TypeGroup {
  name: string;
  types: LeaveType[];
}
export interface Decision {
  typeId?: string;
  status: 'eligible' | 'not-eligible' | 'to-confirm';
  reasonCode: string;
  reason: string;
  policyVersion: string;
}
export interface EligibilityResponse {
  schemaVersion: string;
  companyId: string;
  employeeId: string;
  countryCode: string;
  asOf: string;
  evaluationId: string;
  policyVersion: string;
  decisions: readonly Decision[];
}
export interface Fixtures {
  company: { id: string; name: string; countryCode: string };
  departments: readonly Group[];
  teams: readonly Group[];
  people: readonly Person[];
  entries: readonly Entry[];
  person(id: string | null): Person | undefined;
  allowedScopes(person: Person | null): string[];
  allowedTeams(person: Person): Group[];
  allowedDepartments(person: Person): Group[];
  peopleFor(person: Person, scope: string, group?: string | null): Person[];
  ownEntries(person: Person): Entry[];
  availabilityFor(person: Person, scope: string, group?: string | null): Entry[];
  balancesFor(person: Person | null): Record<string, Allocation> | null;
  eligibilityProfileFor(person: Person): unknown;
}
export interface SessionState {
  currentUser(): Person | null;
  login(username: string, password: string): boolean | Promise<boolean>;
  logout(): void;
}
export interface Catalogue {
  workWeekDays: number;
  types: readonly LeaveType[];
  shortlistIds: readonly string[];
  getType(id: string): LeaveType | undefined;
  typeLabel(type: LeaveType): string;
  typeGroups(types: readonly LeaveType[]): TypeGroup[];
  balanceOf(id: string): Balance | null;
}
export interface Eligibility {
  getResponse(): EligibilityResponse | null;
  decisionFor(id: string): Decision;
}
export interface WorkspaceEnvironment {
  VacateFixtures: Fixtures;
  VacateSession: SessionState;
  VacateLeave: Catalogue;
  VacateEligibility: Eligibility;
}
export type CalendarLayout = 'calendar' | 'planner';
export type ColorScheme = 'a' | 'c';
export interface DisplayPreferences {
  layout: CalendarLayout;
  colorScheme: ColorScheme;
}
export interface CalendarState {
  page: 'calendar' | 'balances' | 'settings' | 'organization';
  layout: CalendarLayout;
  colorScheme: ColorScheme;
  scope: string;
  groupId: string | null;
  denied: boolean;
  view: string;
  date: Date;
}

export interface OwnProfileFields {
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
  married: boolean;
  dependentChildren: number;
  soleCare: boolean;
}
export interface Lifecycle {
  createdAt: string;
  updatedAt: string;
  deleteRequestedAt: string | null;
  deletedAt: string | null;
}
export interface OwnProfile extends OwnProfileFields, Lifecycle {
  id: number;
  guid: string;
  username: string;
  status: string;
  membership:
    | null
    | (Lifecycle & {
        id: number;
        guid: string;
        companyId: string;
        systemRoleId: string;
        jobRoleId: string;
        departmentId: string | null;
        teamId: string | null;
        managerUserId: string | null;
        hireDate: string | null;
        employmentEndDate: string | null;
        priorService: number | null;
        workScheduleId: string | null;
        holidayCalendarId: string | null;
        leavePolicyId: string | null;
        balance: {
          policyMinimum: number | null;
          customAllocation: number | null;
          allocation: number | null;
          used: number;
          pending: number;
          available: number | null;
          periodStart: string;
          periodEnd: string;
        };
      });
}
export interface OwnProfiles {
  read(): OwnProfile | null;
  update(
    targetId: string,
    fields: unknown,
  ): { ok: boolean; error?: string } | Promise<{ ok: boolean; error?: string }>;
  clear(): void;
}

export interface OrganizationNode extends Lifecycle {
  id: string;
  name: string;
}
export interface OrganizationTeam extends OrganizationNode {
  departmentId: string | null;
  members: { id: string; name: string; jobTitle: string; systemRole: string }[];
}
export interface OrganizationRecord extends Lifecycle {
  companyId: string;
  name: string;
  workWeekDays: number;
  departments: OrganizationNode[];
  teams: OrganizationTeam[];
  members: OrganizationTeam['members'];
}
export interface OrganizationStore {
  summary(): { name: string; workWeekDays: number } | null;
  groupName(kind: string, id: string): string | null;
  read(companyId: string): OrganizationRecord | null;
  update(
    companyId: string,
    actorId: string,
    patch: unknown,
  ): { ok: boolean; error?: string } | Promise<{ ok: boolean; error?: string }>;
  rename(
    companyId: string,
    actorId: string,
    kind: string,
    id: string,
    name: string,
  ): { ok: boolean; error?: string } | Promise<{ ok: boolean; error?: string }>;
  clear(): void;
}

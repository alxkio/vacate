export type Person = {
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
export type Group = {
  id: string;
  name: string;
  companyId: string;
  departmentId?: string;
}
export type Entry = {
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
export type Allocation = {
  allocation: number;
  used: number;
  pending: number;
  period: string;
  note: string;
}
export type Balance = {
  available: number;
  percentage: number | null;
} & Allocation
export type LeaveType = {
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
export type TypeGroup = {
  name: string;
  types: LeaveType[];
}
export type Decision = {
  typeId?: string;
  status: 'eligible' | 'not-eligible' | 'to-confirm';
  reasonCode: string;
  reason: string;
  policyVersion: string;
}
export type EligibilityResponse = {
  schemaVersion: string;
  companyId: string;
  employeeId: string;
  countryCode: string;
  asOf: string;
  evaluationId: string;
  policyVersion: string;
  decisions: readonly Decision[];
}
export type Fixtures = {
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
export type SessionState = {
  currentUser(): Person | null;
  login(username: string, password: string): boolean | Promise<boolean>;
  logout(): void;
}
export type Catalogue = {
  workWeekDays: number;
  types: readonly LeaveType[];
  shortlistIds: readonly string[];
  getType(id: string): LeaveType | undefined;
  typeLabel(type: LeaveType): string;
  typeGroups(types: readonly LeaveType[]): TypeGroup[];
  balanceOf(id: string): Balance | null;
}
export type Eligibility = {
  getResponse(): EligibilityResponse | null;
  decisionFor(id: string): Decision;
}
export type WorkspaceEnvironment = {
  VacateFixtures: Fixtures;
  VacateSession: SessionState;
  VacateLeave: Catalogue;
  VacateEligibility: Eligibility;
}
export type CalendarLayout = 'calendar' | 'planner';
export type ColorScheme = 'a' | 'c';
export type DisplayPreferences = {
  layout: CalendarLayout;
  colorScheme: ColorScheme;
}
export type CalendarState = {
  page:
    | 'calendar'
    | 'balances'
    | 'settings'
    | 'organization'
    | 'leave'
    | 'people'
    | 'approvals'
    | 'admin-balances';
  layout: CalendarLayout;
  colorScheme: ColorScheme;
  scope: string;
  groupId: string | null;
  denied: boolean;
  view: string;
  date: Date;
}

export type OwnProfileFields = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
  married: boolean;
  dependentChildren: number;
  soleCare: boolean;
}
export type Lifecycle = {
  createdAt: string;
  updatedAt: string;
  deleteRequestedAt: string | null;
  deletedAt: string | null;
}
export type OwnProfile = {
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
} & OwnProfileFields & Lifecycle
export type OwnProfiles = {
  read(): OwnProfile | null;
  update(
    targetId: string,
    fields: unknown,
  ): { ok: boolean; error?: string } | Promise<{ ok: boolean; error?: string }>;
  clear(): void;
}

export type OrganizationNode = {
  id: string;
  name: string;
} & Lifecycle
export type OrganizationTeam = {
  departmentId: string | null;
  members: { id: string; name: string; jobTitle: string; systemRole: string }[];
} & OrganizationNode
export type OrganizationRecord = {
  settings?: import('../http/contracts').VacationSettings;
  companyId: string;
  name: string;
  workWeekDays: number;
  departments: OrganizationNode[];
  teams: OrganizationTeam[];
  members: OrganizationTeam['members'];
} & Lifecycle
export type OrganizationStore = {
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

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
export interface DemoSession {
  currentUser(): Person | null;
  login(username: string, password: string): boolean;
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
export interface DemoEnvironment {
  VacateFixtures: Fixtures;
  VacateDemo: DemoSession;
  VacateLeave: Catalogue;
  VacateEligibility: Eligibility;
}
export interface CalendarState {
  page: 'calendar' | 'balances';
  direction: string;
  scope: string;
  groupId: string | null;
  denied: boolean;
  view: string;
  date: Date;
}

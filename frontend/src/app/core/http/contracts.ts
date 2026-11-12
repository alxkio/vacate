import { Lifecycle, OwnProfile, Person } from '../models/workspace.models';
export type MemberRecord = {
  userId: number;
  userGuid: string;
  person: Person;
  membership: NonNullable<OwnProfile['membership']>;
};
export type ReferenceRecord = {
  id: number;
  guid: string;
  name: string;
};
export type Roles = {
  systemRoles: ReferenceRecord[];
  jobRoles: ReferenceRecord[];
  workSchedules: ReferenceRecord[];
};
export type CurrentSession = {
  person: Person;
  profile: OwnProfile;
};
export type SignInResult = {
  accessToken: string;
  expiresAt: string;
  person: Person;
};
export type OrganizationSummary = {
  id: number;
  guid: string;
  name: string;
  workWeekDays: number;
  departmentName: string | null;
  teamName: string | null;
  teamMembers: DirectoryUser[];
  settingsAccess?: SettingsAccess;
};
export type VacationSettings = {
  timeZone?: string;
  countryCode?: string | null;
  requireVacationApproval: boolean;
  departmentLeadSettingsEnabled: boolean;
  teamLeadSettingsEnabled: boolean;
  carryoverEnabled: boolean;
  carryoverYears: number;
};
export type SettingsAccess = {
  role: string;
  organization: boolean;
  effectiveVacationApproval: boolean;
  departments: ApiDepartment[];
  teams: ApiTeam[];
};
export type ApiDepartment = {
  id: number;
  guid: string;
  name: string;
  requireVacationApproval?: boolean | null;
} & Lifecycle;
export type ApiTeam = {
  departmentId: string | null;
} & ApiDepartment;
export type OrganizationResponse = {
  id: number;
  guid: string;
  name: string;
  workWeekDays: number;
  departments: ApiDepartment[];
  teams: ApiTeam[];
  settings?: VacationSettings;
} & Lifecycle;

export type DirectoryUser = {
  guid?: string;
  departmentId?: string | null;
  departmentName?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  username: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
  jobTitle: string | null;
  systemRole: string | null;
};

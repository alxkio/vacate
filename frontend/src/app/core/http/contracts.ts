import { OwnProfile, Person, OrganizationRecord, Lifecycle } from '../models/workspace.models';
export interface MemberRecord {
  userId: number;
  userGuid: string;
  person: Person;
  membership: NonNullable<OwnProfile['membership']>;
}
export interface ReferenceRecord {
  id: number;
  guid: string;
  name: string;
}
export interface Roles {
  systemRoles: ReferenceRecord[];
  jobRoles: ReferenceRecord[];
  workSchedules: ReferenceRecord[];
}
export interface CurrentSession {
  person: Person;
  profile: OwnProfile;
}
export interface SignInResult {
  accessToken: string;
  expiresAt: string;
  person: Person;
}
export interface OrganizationSummary {
  id: number;
  guid: string;
  name: string;
  workWeekDays: number;
  departmentName: string | null;
  teamName: string | null;
  teamMembers: DirectoryUser[];
  settingsAccess?: SettingsAccess;
}
export interface VacationSettings {
  requireVacationApproval: boolean;
  departmentLeadSettingsEnabled: boolean;
  teamLeadSettingsEnabled: boolean;
  carryoverEnabled: boolean;
  carryoverYears: number;
}
export interface SettingsAccess {
  role: string;
  organization: boolean;
  effectiveVacationApproval: boolean;
  departments: ApiDepartment[];
  teams: ApiTeam[];
}
export interface ApiDepartment extends Lifecycle {
  id: number;
  guid: string;
  name: string;
  requireVacationApproval?: boolean | null;
}
export interface ApiTeam extends ApiDepartment {
  departmentId: string | null;
}
export interface OrganizationResponse extends Lifecycle {
  id: number;
  guid: string;
  name: string;
  workWeekDays: number;
  departments: ApiDepartment[];
  teams: ApiTeam[];
  settings?: VacationSettings;
}

export interface DirectoryUser {
  username: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
  jobTitle: string | null;
  systemRole: string | null;
}

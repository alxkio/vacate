import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  OwnProfile,
  Person,
  OrganizationRecord,
  OrganizationStore,
  OwnProfiles,
} from '../models/workspace.models';

import { MemberRecord, Roles, OrganizationSummary } from '../http/contracts';
import { UserApiService } from '../http/user-api.service';
import { MembershipApiService } from '../http/membership-api.service';
import { OrganizationApiService } from '../http/organization-api.service';
import { SessionApiService } from '../http/session-api.service';

const aliases = new Map<string, string>(
  [
    [100, 'northstar'],
    [300, 'technology'],
    [301, 'business'],
    [400, 'platform'],
    [401, 'applications'],
    [402, 'product'],
    [403, 'operations'],
  ].map(([number, alias]) => [
    `20000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
    String(alias),
  ]),
);
export const displayId = (id: string | null | undefined) => (id ? aliases.get(id) || id : '');
export const apiId = (id: string) => [...aliases].find(([, alias]) => alias === id)?.[0] || id;

@Injectable({ providedIn: 'root' })
export class WorkspaceApiService {
  private readonly users = inject(UserApiService);
  private readonly memberships = inject(MembershipApiService);
  private readonly organizations = inject(OrganizationApiService);
  private readonly sessions = inject(SessionApiService);
  private token = sessionStorage.getItem('vacate.session.token') || '';
  private initialized = false;
  private actor: Person | null = null;
  private profile: OwnProfile | null = null;
  private org: OrganizationRecord | null = null;
  private summaryRecord: OrganizationSummary | null = null;
  members: MemberRecord[] = [];
  roles: Roles = { systemRoles: [], jobRoles: [], workSchedules: [] };
  error = '';

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    if (!this.token) return;
    try {
      await this.refresh();
    } catch {
      this.clear();
      this.error = 'The API session is unavailable. Sign in again.';
    }
  }

  currentUser() {
    return this.token && sessionStorage.getItem('vacate.session.token') === this.token
      ? this.actor
      : null;
  }

  async login(username: string, password: string) {
    this.logout();
    try {
      const response = await firstValueFrom(this.sessions.signIn(username, password));
      this.token = response.accessToken;
      sessionStorage.setItem('vacate.session.token', this.token);
      await this.refresh();
      this.error = '';
      return true;
    } catch {
      this.clear();
      this.error =
        'Sign-in failed. Check your development credentials and that the API is running.';
      return false;
    }
  }

  logout() {
    const token = this.token;
    this.clear();
    if (token) void firstValueFrom(this.sessions.signOut(token)).catch(() => {});
  }

  private clear() {
    this.token = '';
    this.actor = null;
    this.profile = null;
    this.org = null;
    this.summaryRecord = null;
    this.members = [];
    this.roles = { systemRoles: [], jobRoles: [], workSchedules: [] };
    sessionStorage.removeItem('vacate.session.token');
    sessionStorage.removeItem('vacate.demo.account.v2');
  }

  async refresh() {
    const token = this.token;
    const response = await firstValueFrom(this.sessions.current(token));
    const companyId = response.profile.membership?.companyId;
    const summary = companyId
      ? await firstValueFrom(this.organizations.summary(companyId, token))
      : null;
    let org: OrganizationRecord | null = null;
    let members: MemberRecord[] = [];
    let roles = this.roles;
    if (companyId && response.person.capability === 'admin') {
      const [record, memberRecords, roleRecords] = await Promise.all([
        firstValueFrom(this.organizations.get(companyId, token)),
        firstValueFrom(this.memberships.list(companyId, token)),
        firstValueFrom(this.organizations.references(companyId, token)),
      ]);
      members = memberRecords;
      roles = roleRecords;
      const member = (item: MemberRecord) => ({
        id: item.userGuid,
        name: item.person.name,
        jobTitle: item.person.title,
        systemRole: item.person.capability === 'admin' ? 'Admin' : 'Employee',
      });
      org = {
        ...record,
        companyId: displayId(record.guid),
        departments: record.departments.map((x) => ({ ...x, id: displayId(x.guid) })),
        teams: record.teams.map((x) => ({
          ...x,
          id: displayId(x.guid),
          departmentId: x.departmentId ? displayId(x.departmentId) : null,
          members: members.filter((m) => m.membership.teamId === x.guid).map(member),
        })),
        members: members.map(member),
      };
    }
    if (token !== this.token) throw Error('Your account changed.');
    this.actor = {
      ...response.person,
      companyId: displayId(companyId),
      departmentId: displayId(response.profile.membership?.departmentId),
      teamId: displayId(response.profile.membership?.teamId),
    };
    this.profile = response.profile;
    this.summaryRecord = summary;
    this.org = org;
    this.members = members;
    this.roles = roles;
  }

  private async write(actorId: string, save: (token: string) => Promise<unknown>) {
    if (this.actor?.id !== actorId)
      return { ok: false, error: 'Your account changed. Reopen the page before saving.' };
    const token = this.token;
    try {
      await save(token);
      if (token !== this.token)
        return { ok: false, error: 'Your account changed. Reopen the page.' };
      await this.refresh();
      return { ok: true };
    } catch (error: any) {
      if (token === this.token && [401, 403, 404].includes(error.status)) this.clear();
      return {
        ok: false,
        error:
          error.error?.error || error.message || 'The API could not save these changes. Try again.',
      };
    }
  }

  updateMembership(actorId: string, userGuid: string, patch: unknown) {
    return this.write(actorId, (token) =>
      firstValueFrom(
        this.memberships.update(this.profile?.membership?.companyId || '', userGuid, patch, token),
      ),
    );
  }

  readonly profiles: OwnProfiles = {
    read: () => (this.profile ? structuredClone(this.profile) : null),
    update: (actorId, patch) =>
      this.write(actorId, (token) =>
        firstValueFrom(this.users.updateProfile(this.profile?.guid || '', patch, token)),
      ),
    clear: () => {},
  };
  readonly organization: OrganizationStore = {
    summary: () => this.summaryRecord,
    read: (id) =>
      this.actor?.capability === 'admin' && id === this.actor.companyId && this.org
        ? structuredClone(this.org)
        : null,
    groupName: (kind, id) => {
      const group = (kind === 'department' ? this.org?.departments : this.org?.teams)?.find(
        (x) => x.id === id,
      );
      if (group) return group.name;
      return id === (kind === 'department' ? this.actor?.departmentId : this.actor?.teamId)
        ? (kind === 'department'
            ? this.summaryRecord?.departmentName
            : this.summaryRecord?.teamName) || null
        : null;
    },
    update: (id, actor, patch) =>
      this.writeOrganization(id, actor, (token) =>
        firstValueFrom(this.organizations.update(apiId(id), patch, token)),
      ),
    rename: (id, actor, kind, nodeId, name) =>
      this.writeOrganization(id, actor, (token) =>
        firstValueFrom(
          this.organizations.renameNode(
            apiId(id),
            kind === 'department' ? 'departments' : 'teams',
            apiId(nodeId),
            name,
            token,
          ),
        ),
      ),
    clear: () => {},
  };

  private writeOrganization(id: string, actor: string, save: (token: string) => Promise<unknown>) {
    if (id !== this.actor?.companyId)
      return Promise.resolve({ ok: false, error: 'Organization unavailable.' });
    return this.write(actor, save);
  }
}

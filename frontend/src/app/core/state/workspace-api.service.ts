import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  OrganizationRecord,
  OrganizationStore,
  OwnProfile,
  OwnProfiles,
  Person,
} from '../models/workspace.models';

import {
  DirectoryUser,
  MemberRecord,
  OrganizationSummary,
  Roles,
  SettingsAccess,
  VacationSettings,
} from '../http/contracts';
import { UserApiService } from '../http/user-api.service';
import { MembershipApiService } from '../http/membership-api.service';
import { OrganizationApiService } from '../http/organization-api.service';
import { SessionApiService } from '../http/session-api.service';
import { ApiClient } from '../http/api-client';

// Public GUIDs stay unchanged across the HTTP and view-model boundaries.

export type MemberWorkspace = {
  companyId: string;
  countryCode: string | null;
  departments: { guid: string; name: string }[];
  teams: { guid: string; name: string; departmentId: string | null }[];
  people: DirectoryUser[];
  availability: { userGuid: string; date: string }[];
};

@Injectable({ providedIn: 'root' })
export class WorkspaceApiService {
  private readonly client = inject(ApiClient);
  private readonly users = inject(UserApiService);
  private readonly memberships = inject(MembershipApiService);
  private readonly organizations = inject(OrganizationApiService);
  private readonly sessions = inject(SessionApiService);
  private token = sessionStorage.getItem('vacate.session.token') || '';
  private initialized = false;
  private generation = 0;
  private recoveryNeeded = false;
  private restoration?: { token: string; result: Promise<boolean> };

  get sessionGeneration(): number {
    return this.generation;
  }
  private actor: Person | null = null;
  private profile: OwnProfile | null = null;
  private workspaceRecord: MemberWorkspace | null = null;

  get workspace(): MemberWorkspace | null {
    return this.currentUser() ? this.workspaceRecord : null;
  }
  private org: OrganizationRecord | null = null;
  private summaryRecord: OrganizationSummary | null = null;
  members: MemberRecord[] = [];
  roles: Roles = { systemRoles: [], jobRoles: [], workSchedules: [] };
  error = '';

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    if (!this.token) {
      return;
    }
    await this.restoreSession();
  }

  get sessionRecoveryAvailable(): boolean {
    return (
      this.recoveryNeeded &&
      !!this.token &&
      sessionStorage.getItem('vacate.session.token') === this.token
    );
  }

  async restoreSession(): Promise<boolean> {
    const token = this.token;
    if (!token) return false;
    if (this.restoration?.token === token) return this.restoration.result;
    const restoration = { token, result: this.restoreCurrentSession(token) };
    this.restoration = restoration;
    try {
      return await restoration.result;
    } finally {
      if (this.restoration === restoration) this.restoration = undefined;
    }
  }

  private async restoreCurrentSession(token: string): Promise<boolean> {
    try {
      await this.refresh();
      return true;
    } catch (error: unknown) {
      if (token !== this.token) return false;
      if (
        (error as { status?: number }).status === 401 ||
        sessionStorage.getItem('vacate.session.token') !== token
      ) {
        this.clear();
        this.error = 'Your session ended. Sign in again to return to your page.';
      } else {
        // Keep the ticket for recovery, but do not expose a partially loaded or stale account.
        this.generation++;
        this.clearWorkspace();
        this.recoveryNeeded = true;
        this.error = 'Vacate could not reconnect to your workspace. Retry your saved session.';
      }
      return false;
    }
  }

  currentUser(): Person | null {
    return this.token && sessionStorage.getItem('vacate.session.token') === this.token
      ? this.actor
      : null;
  }

  async login(username: string, password: string): Promise<boolean> {
    this.logout();
    try {
      const response = await firstValueFrom(this.sessions.signIn(username, password));
      this.token = response.accessToken;
      sessionStorage.setItem('vacate.session.token', this.token);
      return await this.restoreSession();
    } catch {
      this.clear();
      this.error =
        'Sign-in failed. Check your development credentials and that the API is running.';
      return false;
    }
  }

  logout(): void {
    const token = this.token;
    this.clear();
    if (token) {
      void firstValueFrom(this.sessions.signOut(token)).catch(() => {});
    }
  }

  private clear(): void {
    this.generation++;
    this.token = '';
    this.recoveryNeeded = false;
    this.clearWorkspace();
    sessionStorage.removeItem('vacate.session.token');
    sessionStorage.removeItem('vacate.demo.account.v2');
  }

  private clearWorkspace(): void {
    this.actor = null;
    this.profile = null;
    this.workspaceRecord = null;
    this.org = null;
    this.summaryRecord = null;
    this.members = [];
    this.roles = { systemRoles: [], jobRoles: [], workSchedules: [] };
  }

  async authenticatedRequest<T>(
    actorId: string,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = this.token;
    if (!this.currentUser() || this.actor?.id !== actorId) {
      throw Error('Your account changed. Reopen the page.');
    }
    const result = await firstValueFrom(this.client.request<T>(method, path, token, body));
    if (token !== this.token || this.currentUser()?.id !== actorId) {
      throw Error('Your account changed. Reopen the page.');
    }
    return result;
  }

  async validateSession(): Promise<boolean> {
    if (!this.currentUser()) return false;
    const token = this.token;
    try {
      await firstValueFrom(this.sessions.current(token));
    } catch {
      // Authentication failures clear browser credentials in ApiClient; offline errors stay recoverable.
    }
    return token === this.token && !!this.currentUser();
  }

  async refreshWorkspace(): Promise<void> {
    const actor = this.currentUser();
    const generation = this.generation;
    if (!actor) return;
    try {
      const workspace = await this.authenticatedRequest<MemberWorkspace>(
        actor.id,
        'GET',
        `organizations/${actor.companyId}/workspace`,
      );
      if (this.currentUser()?.id === actor.id && generation === this.generation)
        this.workspaceRecord = workspace;
    } catch (error) {
      if (this.currentUser()?.id === actor.id && generation === this.generation)
        this.workspaceRecord = null;
      throw error;
    }
  }

  async directory(): Promise<DirectoryUser[]> {
    const token = this.token;
    const people = await firstValueFrom(this.users.list(token));
    if (!token || token !== this.token) {
      throw Error('Your account changed. Reopen People.');
    }
    return people;
  }

  get teamMembers(): DirectoryUser[] | undefined {
    return this.summaryRecord?.teamMembers;
  }

  get settingsAccess(): SettingsAccess | undefined {
    return this.summaryRecord?.settingsAccess;
  }

  get organizationSettings(): VacationSettings | undefined {
    return this.org?.settings;
  }

  updateOrganizationSettings(
    actorId: string,
    patch: unknown,
  ): Promise<{ ok: boolean; error?: undefined } | { ok: boolean; error: any }> {
    return this.writeOrganization(this.actor?.companyId || '', actorId, (token) =>
      firstValueFrom(this.organizations.update(this.actor!.companyId, patch, token)),
    );
  }

  updateApproval(
    actorId: string,
    kind: 'departments' | 'teams',
    nodeId: string,
    required: boolean | null,
  ): Promise<{ ok: boolean; error?: undefined } | { ok: boolean; error: any }> {
    return this.write(actorId, (token) =>
      firstValueFrom(
        this.organizations.updateApproval(this.actor!.companyId, kind, nodeId, required, token),
      ),
    );
  }

  async refresh(): Promise<void> {
    const token = this.token;
    const generation = this.generation;
    const response = await firstValueFrom(this.sessions.current(token));
    const companyId = response.profile.membership?.companyId;
    const [summary, workspace] = companyId
      ? await Promise.all([
          firstValueFrom(this.organizations.summary(companyId, token)),
          firstValueFrom(
            this.client.request<MemberWorkspace>(
              'GET',
              `organizations/${companyId}/workspace`,
              token,
            ),
          ),
        ])
      : [null, null];
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
      const member = (
        item: MemberRecord,
      ): { id: string; name: string; jobTitle: string; systemRole: string } => ({
        id: item.userGuid,
        name: item.person.name,
        jobTitle: item.person.title,
        systemRole: item.person.capability === 'admin' ? 'Admin' : 'Employee',
      });
      org = {
        ...record,
        companyId: record.guid || '',
        departments: record.departments.map((x) => ({ ...x, id: x.guid || '' })),
        teams: record.teams.map((x) => ({
          ...x,
          id: x.guid || '',
          departmentId: x.departmentId ? x.departmentId || '' : null,
          members: members.filter((m) => m.membership.teamId === x.guid).map(member),
        })),
        members: members.map(member),
      };
    }
    if (
      token !== this.token ||
      generation !== this.generation ||
      sessionStorage.getItem('vacate.session.token') !== token
    ) {
      throw Error('Your account changed.');
    }
    this.actor = {
      ...response.person,
      companyId: companyId || '',
      departmentId: response.profile.membership?.departmentId || '',
      teamId: response.profile.membership?.teamId || '',
    };
    this.profile = response.profile;
    this.workspaceRecord = workspace;
    this.summaryRecord = summary;
    this.org = org;
    this.members = members;
    this.roles = roles;
    this.recoveryNeeded = false;
    this.error = '';
  }

  private async write(
    actorId: string,
    save: (token: string) => Promise<unknown>,
  ): Promise<{ ok: boolean; error?: undefined } | { ok: boolean; error: any }> {
    if (this.actor?.id !== actorId) {
      return { ok: false, error: 'Your account changed. Reopen the page before saving.' };
    }
    const token = this.token;
    try {
      await save(token);
      if (token !== this.token) {
        return { ok: false, error: 'Your account changed. Reopen the page.' };
      }
      await this.refresh();
      return { ok: true };
    } catch (error: any) {
      if (token === this.token && error.status === 401) {
        this.clear();
      }
      return {
        ok: false,
        error:
          error.error?.error || error.message || 'The API could not save these changes. Try again.',
      };
    }
  }

  updateMembership(
    actorId: string,
    userGuid: string,
    patch: unknown,
  ): Promise<{ ok: boolean; error?: undefined } | { ok: boolean; error: any }> {
    return this.write(actorId, (token) =>
      firstValueFrom(
        this.memberships.update(this.profile?.membership?.companyId || '', userGuid, patch, token),
      ),
    );
  }

  readonly profiles: OwnProfiles = {
    read: () => (this.currentUser() && this.profile ? structuredClone(this.profile) : null),
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
      if (group) {
        return group.name;
      }
      return id === (kind === 'department' ? this.actor?.departmentId : this.actor?.teamId)
        ? (kind === 'department'
            ? this.summaryRecord?.departmentName
            : this.summaryRecord?.teamName) || null
        : null;
    },
    update: (id, actor, patch) =>
      this.writeOrganization(id, actor, (token) =>
        firstValueFrom(this.organizations.update(id, patch, token)),
      ),
    rename: (id, actor, kind, nodeId, name) =>
      this.writeOrganization(id, actor, (token) =>
        firstValueFrom(
          this.organizations.renameNode(
            id,
            kind === 'department' ? 'departments' : 'teams',
            nodeId,
            name,
            token,
          ),
        ),
      ),
    clear: () => {},
  };

  createStructure(
    id: string,
    actor: string,
    kind: 'departments' | 'teams',
    name: string,
    departmentId: string | null,
  ) {
    return this.writeOrganization(id, actor, (token) =>
      firstValueFrom(
        this.organizations.createNode(id, kind, name, departmentId ? departmentId : null, token),
      ),
    );
  }

  private writeOrganization(
    id: string,
    actor: string,
    save: (token: string) => Promise<unknown>,
  ): Promise<{ ok: boolean; error?: undefined } | { ok: boolean; error: any }> {
    if (id !== this.actor?.companyId) {
      return Promise.resolve({ ok: false, error: 'Organization unavailable.' });
    }
    return this.write(actor, save);
  }
}

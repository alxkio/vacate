import { inject, Injectable } from '@angular/core';
import { createFixtures } from '../reference-data/fixtures.js';
import { createCatalogue } from '../reference-data/catalogue.js';
import { createEligibility } from '../reference-data/eligibility.js';
import { WorkspaceApiService } from './workspace-api.service';
import {
  Allocation,
  Balance,
  Catalogue,
  Decision,
  DisplayPreferences,
  Eligibility,
  Entry,
  Fixtures,
  Group,
  LeaveType,
  OrganizationStore,
  OwnProfiles,
  Person,
  WorkspaceEnvironment,
} from '../models/workspace.models';

export const currentDate = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const REFERENCE_TODAY = new Date(2026, 9, 22);
const displayPreferencesKey = (person: Person): string =>
  `vacate.display-preferences.v1.${encodeURIComponent(person.companyId)}.${encodeURIComponent(person.id)}`;
const defaultDisplayPreferences: DisplayPreferences = { layout: 'calendar', colorScheme: 'a' };
export const dateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const dateFromKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
export const weekStart = (date: Date): Date => addDays(date, -((date.getDay() + 6) % 7));
export const monthName = (date: Date, style: 'long' | 'short' = 'long'): string =>
  date.toLocaleDateString('en-GB', { month: style });
export const fullDate = (date: Date): string =>
  date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
export const shortDate = (key: string): string =>
  dateFromKey(key).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export const eligibilityLabel = (
  decision: Decision,
): 'Eligible' | 'Not eligible' | 'Eligibility to confirm' =>
  decision.status === 'eligible'
    ? 'Eligible'
    : decision.status === 'not-eligible'
      ? 'Not eligible'
      : 'Eligibility to confirm';
export const formatAmount = (amount: number, unit: string): string =>
  `${amount} ${amount === 1 ? ({ 'working days': 'working day', days: 'day', months: 'month', weeks: 'week', hours: 'hour', 'hours per day': 'hour per day' } as Record<string, string>)[unit] || unit : unit}`;

@Injectable({ providedIn: 'root' })
export class WorkspaceDataService {
  readonly api = inject(WorkspaceApiService);
  readonly initialize = (): Promise<void> => this.api.initialize();
  readonly environment: WorkspaceEnvironment;
  readonly profiles: OwnProfiles;
  readonly organization: OrganizationStore;

  constructor() {
    const fixtures = createFixtures() as unknown as Fixtures;
    this.environment = {
      VacateFixtures: fixtures,
      VacateSession: {
        currentUser: () => this.api.currentUser(),
        login: (username, password) => this.api.login(username, password),
        logout: () => this.api.logout(),
      },
    } as WorkspaceEnvironment;
    this.profiles = this.api.profiles;
    this.organization = this.api.organization;
    this.environment.VacateFixtures = {
      ...fixtures,
      allowedScopes: (person): string[] =>
        this.isCurrentActor(person)
          ? [...new Set([...fixtures.allowedScopes(person), 'self', 'team', 'org'])]
          : fixtures.allowedScopes(person),
      allowedTeams: (person): Group[] => {
        const teams = fixtures.allowedTeams(person);
        if (
          !this.isCurrentActor(person) ||
          !person.teamId ||
          teams.some((team) => team.id === person.teamId)
        ) {
          return teams;
        }
        return [
          ...teams,
          {
            id: person.teamId,
            companyId: person.companyId,
            name: this.groupName('team', person.teamId) || person.team,
          },
        ];
      },
      ownEntries: (person): Entry[] => fixtures.ownEntries(this.referencePerson(person)),
      balancesFor: (person): Record<string, Allocation> | null =>
        fixtures.balancesFor(person ? this.referencePerson(person) : null),
      peopleFor: (person, scope, group): Person[] => {
        if (this.isCurrentActor(person) && scope === 'self') {
          return group && group !== person.id ? [] : [person];
        }
        if (
          this.isCurrentActor(person) &&
          scope === 'team' &&
          (!group || group === person.teamId) &&
          this.api.teamMembers
        ) {
          return this.myTeamPeople;
        }
        return fixtures.peopleFor(person, scope, group);
      },
      availabilityFor: (
        person,
        scope,
        group,
      ): { id: string; person: string; companyId: string; start: string; end: string }[] => {
        if (
          this.isCurrentActor(person) &&
          scope === 'team' &&
          (!group || group === person.teamId) &&
          this.api.teamMembers
        ) {
          const ids = new Set(this.myTeamPeople.map((member) => member.id));
          return fixtures.entries
            .filter((entry) => entry.companyId === person.companyId && ids.has(entry.person))
            .map(({ id, person: personId, companyId, start, end }) => ({
              id,
              person: personId,
              companyId,
              start,
              end,
            }));
        }
        return fixtures.availabilityFor(person, scope, group);
      },
      eligibilityProfileFor: (
        person: import('../models/workspace.models').Person,
      ): Record<string, unknown> | null => {
        const base = fixtures.eligibilityProfileFor(this.referencePerson(person)) as Record<
          string,
          unknown
        > | null;
        const own = this.profiles.read();
        if (!base || !own || person.id !== this.currentUser()?.id) {
          return base;
        }
        return {
          ...base,
          gender: own.gender,
          married: own.married,
          maritalStatus: own.married
            ? 'married'
            : base['maritalStatus'] === 'married'
              ? 'unspecified'
              : base['maritalStatus'],
          hasDependentChildren: own.dependentChildren > 0,
          soleCare: own.soleCare,
        };
      },
    };

    this.environment.VacateLeave = createCatalogue(
      this.environment,
      () => this.api.settingsAccess?.effectiveVacationApproval === true,
    ) as unknown as Catalogue;
    this.environment.VacateEligibility = createEligibility(
      this.environment,
    ) as unknown as Eligibility;
    // Compatibility inspection API for this public demo's existing acceptance suite.
    // Rendering/events belong to Angular. These expose only already-public fictional data.
    for (const name of [
      'VacateFixtures',
      'VacateSession',
      'VacateLeave',
      'VacateEligibility',
    ] as const) {
      Object.defineProperty(window, name, {
        configurable: true,
        get: () => this.environment[name],
        set: (value) => Object.assign(this.environment, { [name]: value }),
      });
    }
  }

  private referencePerson(person: Person): Person {
    const reference = this.environment.VacateFixtures.people.find(
      (item) => item.id === person.id && item.companyId === person.companyId,
    );
    return this.isCurrentActor(person) && reference ? reference : person;
  }

  private isCurrentActor(person: Person | null): boolean {
    const actor = this.api.currentUser();
    return (
      !!actor &&
      !!person &&
      actor.id === person.id &&
      actor.companyId === person.companyId &&
      actor.teamId === person.teamId &&
      actor.departmentId === person.departmentId
    );
  }

  get myTeamPeople(): Person[] {
    const actor = this.currentUser();
    if (!actor?.teamId) {
      return [];
    }
    const members = this.api.teamMembers;
    if (!members) {
      return this.fixtures.peopleFor(actor, 'team');
    }
    return members.map((member) => {
      const reference = this.fixtures.people.find((person) => person.email === member.email);
      return {
        ...actor,
        id: member.email === actor.email ? actor.id : reference?.id || member.username,
        personId:
          member.email === actor.email ? actor.personId : reference?.personId || member.username,
        name: [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' '),
        title: member.jobTitle || '',
        username: member.username,
        email: member.email,
        capability: member.systemRole === 'admin' ? 'admin' : 'employee',
        role: member.systemRole === 'admin' ? 'Admin' : 'Employee',
        initials: (member.firstName[0] + member.lastName[0]).toUpperCase(),
      };
    });
  }

  get companyName(): string {
    return this.organization.summary()?.name || this.fixtures.company.name;
  }
  get companyWorkWeekDays(): number {
    return this.organization.summary()?.workWeekDays || 5;
  }

  groupName(kind: string, id: string): string | null {
    return this.organization.groupName(kind, id);
  }

  get fixtures(): Fixtures {
    return this.environment.VacateFixtures;
  }
  get catalogue(): Catalogue {
    return this.environment.VacateLeave;
  }
  get eligibility(): Eligibility {
    return this.environment.VacateEligibility;
  }

  currentUser(): Person | null {
    return this.environment.VacateSession.currentUser();
  }

  displayPreferences(person: Person | null = this.currentUser()): DisplayPreferences {
    if (!person) {
      return { ...defaultDisplayPreferences };
    }
    const stored = localStorage.getItem(displayPreferencesKey(person));
    if (!stored) {
      return { ...defaultDisplayPreferences };
    }
    const [layout, colorScheme] = stored.split('|');
    return {
      layout: layout === 'planner' ? 'planner' : 'calendar',
      colorScheme: colorScheme === 'c' ? 'c' : 'a',
    };
  }

  saveDisplayPreferences(
    account: Pick<Person, 'id' | 'companyId'>,
    preferences: DisplayPreferences,
  ): { ok: boolean; error?: string } {
    const current = this.currentUser();
    if (!current || current.id !== account.id || current.companyId !== account.companyId) {
      return { ok: false, error: 'Your account changed. Reopen settings before saving.' };
    }
    if (
      !['calendar', 'planner'].includes(preferences.layout) ||
      !['a', 'c'].includes(preferences.colorScheme)
    ) {
      return { ok: false, error: 'Choose a supported calendar layout and color scheme.' };
    }
    try {
      localStorage.setItem(
        displayPreferencesKey(current),
        `${preferences.layout}|${preferences.colorScheme}`,
      );
    } catch {
      return {
        ok: false,
        error:
          'This browser could not save your display preferences. Check browser storage permissions and try again.',
      };
    }
    return { ok: true };
  }

  decision(id: string): Decision {
    return this.eligibility.decisionFor(id);
  }

  balance(id: string): Balance | null {
    if (id === 'annual') {
      const balance = this.profiles.read()?.membership?.balance;
      const allocation = balance?.customAllocation ?? balance?.allocation;
      if (!balance || allocation === null || allocation === undefined) return null;
      const available =
        allocation -
        balance.used -
        (this.api.settingsAccess?.effectiveVacationApproval === true ? 0 : balance.pending);
      return {
        allocation,
        available,
        used: balance.used,
        pending: balance.pending,
        percentage: allocation > 0 ? Math.round((available / allocation) * 100) : null,
        period: `${balance.periodStart} – ${balance.periodEnd}`,
        note:
          balance.allocation === null
            ? 'Configured allowance; policy minimum to confirm.'
            : 'Saved annual balance',
      };
    }
    return this.decision(id).status === 'eligible' ? this.catalogue.balanceOf(id) : null;
  }

  label(type: LeaveType): string {
    return this.catalogue.typeLabel(type);
  }

  typeName(id?: string): string {
    if (id === 'company-closure') return 'Company closure';
    const type = id && this.catalogue.getType(id);
    return type ? this.label(type) : 'Leave';
  }

  visibleShortlist(): LeaveType[] {
    return this.catalogue.shortlistIds
      .map((id) => this.catalogue.getType(id)!)
      .filter((type) => this.decision(type.id).status !== 'not-eligible');
  }

  logout(): void {
    this.environment.VacateSession.logout();
    location.replace('/login.html');
  }
}

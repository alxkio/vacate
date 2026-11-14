import { inject, Injectable } from '@angular/core';
import { createWorkspaceReadModel } from './workspace-read-model';
import { createCatalogue } from '../reference-data/catalogue.js';
import { createEligibility } from '../reference-data/eligibility.js';
import { WorkspaceApiService } from './workspace-api.service';
import {
  Balance,
  Catalogue,
  Decision,
  DisplayPreferences,
  Eligibility,
  Fixtures,
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
    this.profiles = this.api.profiles;
    this.organization = this.api.organization;
    this.environment = {
      VacateFixtures: createWorkspaceReadModel(this.api),
      VacateSession: {
        currentUser: () => this.api.currentUser(),
        login: (username, password) => this.api.login(username, password),
        logout: () => this.api.logout(),
      },
    } as WorkspaceEnvironment;

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

  get myTeamPeople(): Person[] {
    const actor = this.currentUser();
    return actor ? this.fixtures.peopleFor(actor, 'team') : [];
  }

  get companyName(): string {
    return this.organization.summary()?.name || 'Organization unavailable';
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
    return null;
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

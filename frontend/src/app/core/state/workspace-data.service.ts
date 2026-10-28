import { inject, Injectable } from '@angular/core';
import { createFixtures } from '../reference-data/fixtures.js';
import { createCatalogue } from '../reference-data/catalogue.js';
import { createEligibility } from '../reference-data/eligibility.js';
import { WorkspaceApiService } from './workspace-api.service';
import {
  Catalogue,
  Decision,
  WorkspaceEnvironment,
  Eligibility,
  Fixtures,
  LeaveType,
  DisplayPreferences,
  OwnProfiles,
  OrganizationStore,
  Person,
} from '../models/workspace.models';

export const REFERENCE_TODAY = new Date(2026, 9, 22);
const displayPreferencesKey = (person: Person) =>
  `vacate.display-preferences.v1.${encodeURIComponent(person.companyId)}.${encodeURIComponent(person.id)}`;
const defaultDisplayPreferences: DisplayPreferences = { layout: 'calendar', colorScheme: 'a' };
export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const dateFromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
export const weekStart = (date: Date) => addDays(date, -((date.getDay() + 6) % 7));
export const monthName = (date: Date, style: 'long' | 'short' = 'long') =>
  date.toLocaleDateString('en-GB', { month: style });
export const fullDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
export const shortDate = (key: string) =>
  dateFromKey(key).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export const eligibilityLabel = (decision: Decision) =>
  decision.status === 'eligible'
    ? 'Eligible'
    : decision.status === 'not-eligible'
      ? 'Not eligible'
      : 'Eligibility to confirm';
export const formatAmount = (amount: number, unit: string) =>
  `${amount} ${amount === 1 ? ({ 'working days': 'working day', days: 'day', months: 'month', weeks: 'week', hours: 'hour', 'hours per day': 'hour per day' } as Record<string, string>)[unit] || unit : unit}`;

@Injectable({ providedIn: 'root' })
export class WorkspaceDataService {
  readonly api = inject(WorkspaceApiService);
  readonly initialize = () => this.api.initialize();
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
      eligibilityProfileFor: (person: import('../models/workspace.models').Person) => {
        const base = fixtures.eligibilityProfileFor(person) as Record<string, unknown> | null;
        const own = this.profiles.read();
        if (!base || !own || person.id !== this.currentUser()?.id) return base;
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

    this.environment.VacateLeave = createCatalogue(this.environment) as unknown as Catalogue;
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

  get companyName() {
    return this.organization.summary()?.name || this.fixtures.company.name;
  }
  get companyWorkWeekDays() {
    return this.organization.summary()?.workWeekDays || 5;
  }

  groupName(kind: string, id: string) {
    return this.organization.groupName(kind, id);
  }

  get fixtures() {
    return this.environment.VacateFixtures;
  }
  get catalogue() {
    return this.environment.VacateLeave;
  }
  get eligibility() {
    return this.environment.VacateEligibility;
  }

  currentUser() {
    return this.environment.VacateSession.currentUser();
  }

  displayPreferences(person: Person | null = this.currentUser()): DisplayPreferences {
    if (!person) return { ...defaultDisplayPreferences };
    const stored = localStorage.getItem(displayPreferencesKey(person));
    if (!stored) return { ...defaultDisplayPreferences };
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
    if (!current || current.id !== account.id || current.companyId !== account.companyId)
      return { ok: false, error: 'Your account changed. Reopen settings before saving.' };
    if (
      !['calendar', 'planner'].includes(preferences.layout) ||
      !['a', 'c'].includes(preferences.colorScheme)
    )
      return { ok: false, error: 'Choose a supported calendar layout and color scheme.' };
    try {
      localStorage.setItem(
        displayPreferencesKey(current),
        `${preferences.layout}|${preferences.colorScheme}`,
      );
    } catch {
      return {
        ok: false,
        error: 'This browser could not save your display preferences. Check browser storage permissions and try again.',
      };
    }
    return { ok: true };
  }

  decision(id: string) {
    return this.eligibility.decisionFor(id);
  }

  balance(id: string) {
    return this.decision(id).status === 'eligible' ? this.catalogue.balanceOf(id) : null;
  }

  label(type: LeaveType) {
    return this.catalogue.typeLabel(type);
  }

  typeName(id?: string) {
    const type = id && this.catalogue.getType(id);
    return type ? this.label(type) : 'Leave';
  }

  visibleShortlist() {
    return this.catalogue.shortlistIds
      .map((id) => this.catalogue.getType(id)!)
      .filter((type) => this.decision(type.id).status !== 'not-eligible');
  }

  logout() {
    this.environment.VacateSession.logout();
    location.replace('/login.html');
  }
}

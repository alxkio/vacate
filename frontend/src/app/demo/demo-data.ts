import { Injectable } from '@angular/core';
import { createFixtures } from './data/fixtures.js';
import { createCatalogue } from './data/catalogue.js';
import { createEligibility } from './data/eligibility.js';
import { createSession } from './data/session.js';
import {
  Catalogue,
  Decision,
  DemoEnvironment,
  DemoSession,
  Eligibility,
  Fixtures,
  LeaveType,
} from './models';

export const DEMO_TODAY = new Date(2026, 9, 22);
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
export class DemoData {
  readonly environment: DemoEnvironment;
  constructor() {
    const fixtures = createFixtures() as unknown as Fixtures;
    const session = createSession(fixtures, sessionStorage) as DemoSession;
    this.environment = { VacateFixtures: fixtures, VacateDemo: session } as DemoEnvironment;
    this.environment.VacateLeave = createCatalogue(this.environment) as unknown as Catalogue;
    this.environment.VacateEligibility = createEligibility(
      this.environment,
    ) as unknown as Eligibility;
    // Compatibility inspection API for this public demo's existing acceptance suite.
    // Rendering/events belong to Angular. These expose only already-public fictional data.
    for (const name of [
      'VacateFixtures',
      'VacateDemo',
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
    return this.environment.VacateDemo.currentUser();
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
    this.environment.VacateDemo.logout();
    location.replace('/login.html');
  }
}

// Explicit component-test double. The application never falls back to these local write stores.
import { WorkspaceDataService } from '../src/app/core/state/workspace-data.service';
import { createFixtures } from '../src/app/core/reference-data/fixtures.js';
import { createSession } from './fixtures/session.js';
import { createProfiles } from './fixtures/profiles.js';
import { createOrganization } from './fixtures/organization.js';
import type { DisplayPreferences, Person } from '../src/app/core/models/workspace.models';

const defaultDisplayPreferences: DisplayPreferences = { layout: 'calendar', colorScheme: 'a' };

const displayPreferencesKey = (person: Person) =>
  `vacate.display-preferences.v1.${encodeURIComponent(person.companyId)}.${encodeURIComponent(person.id)}`;

export const fixtureWorkspaceProvider = {
  provide: WorkspaceDataService,
  useFactory: () => {
    const fixtures = createFixtures();
    const environment = {
      VacateFixtures: fixtures,
      VacateSession: createSession(fixtures, sessionStorage),
    };
    const profiles = createProfiles(environment),
      organization = createOrganization(environment);
    const session = environment.VacateSession;
    environment.VacateSession = {
      ...session,
      login: (u: string, p: string) => {
        profiles.clear();
        organization.clear();
        return session.login(u, p);
      },
      logout: () => {
        profiles.clear();
        organization.clear();
        session.logout();
      },
    };
    return {
      environment,
      profiles,
      organization,
      fixtures,
      api: { members: [], roles: { systemRoles: [], jobRoles: [] } },
      currentUser: () => environment.VacateSession.currentUser(),
      displayPreferences: (person = environment.VacateSession.currentUser()) => {
        if (!person) return { ...defaultDisplayPreferences };

        const stored = localStorage.getItem(displayPreferencesKey(person));
        if (!stored) return { ...defaultDisplayPreferences };

        const [layout, colorScheme] = stored.split('|');

        return {
          layout: layout === 'planner' ? 'planner' : 'calendar',
          colorScheme: colorScheme === 'c' ? 'c' : 'a',
        };
      },
      saveDisplayPreferences: (
        account: Pick<Person, 'id' | 'companyId'>,
        preferences: DisplayPreferences,
      ) => {
        const current = environment.VacateSession.currentUser();
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
      },
      get companyName() {
        return organization.summary()?.name || fixtures.company.name;
      },
      get companyWorkWeekDays() {
        return organization.summary()?.workWeekDays || 5;
      },
      groupName: organization.groupName,
    };
  },
};

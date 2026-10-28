// Explicit component-test double. The application never falls back to these local write stores.
import { WorkspaceDataService } from '../src/app/core/state/workspace-data.service';
import { createFixtures } from '../src/app/core/reference-data/fixtures.js';
import { createSession } from './fixtures/session.js';
import { createProfiles } from './fixtures/profiles.js';
import { createOrganization } from './fixtures/organization.js';
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

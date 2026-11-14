// Explicit component-test double. The application never falls back to these local write stores.
import { WorkspaceDataService } from '../src/app/core/state/workspace-data.service';
import { createFixtures } from './fixtures/leave.js';
import { createSession } from './fixtures/session.js';
import { createProfiles } from './fixtures/profiles.js';
import { createOrganization } from './fixtures/organization.js';
import type {
  DisplayPreferences,
  Fixtures,
  LeaveType,
  Person,
  WorkspaceEnvironment,
} from '../src/app/core/models/workspace.models';
import { createCatalogue } from '../src/app/core/reference-data/catalogue.js';
import { createEligibility } from '../src/app/core/reference-data/eligibility.js';

const defaultDisplayPreferences: DisplayPreferences = { layout: 'calendar', colorScheme: 'a' };

const displayPreferencesKey = (person: Person) =>
  `vacate.display-preferences.v1.${encodeURIComponent(person.companyId)}.${encodeURIComponent(person.id)}`;

export const fixtureWorkspaceProvider = {
  provide: WorkspaceDataService,
  useFactory: () => {
    const fixtures = createFixtures() as unknown as Fixtures;
    const environment = {
      VacateFixtures: fixtures,
      VacateSession: createSession(fixtures, sessionStorage),
    } as WorkspaceEnvironment;
    environment.VacateLeave = createCatalogue(environment, () => true);
    environment.VacateEligibility = createEligibility(environment);
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
      initialize: async () => {},
      environment,
      profiles,
      organization,
      fixtures,
      get catalogue() {
        return environment.VacateLeave;
      },
      get eligibility() {
        return environment.VacateEligibility;
      },
      api: {
        restoreSession: async () => !!environment.VacateSession.currentUser(),
        directory: async () =>
          fixtures.people
            .filter((p) => p.companyId === environment.VacateSession.currentUser()?.companyId)
            .map((p) => ({
              guid: p.id,
              username: p.email,
              email: p.email,
              firstName: p.name,
              middleName: null,
              lastName: '',
              gender: null,
              jobTitle: p.title,
              systemRole: p.capability,
              departmentId: p.departmentId,
              departmentName:
                fixtures.departments.find((d) => d.id === p.departmentId)?.name || null,
              teamId: p.teamId,
              teamName: fixtures.teams.find((t) => t.id === p.teamId)?.name || null,
            })),
        members: [],
        roles: { systemRoles: [], jobRoles: [] },
        refresh: async () => {},
        validateSession: async () => !!environment.VacateSession.currentUser(),
        get settingsAccess() {
          const person = environment.VacateSession.currentUser();
          const admin = person?.capability === 'admin';
          return {
            role: admin
              ? 'admin'
              : person?.id === 'ella'
                ? 'DepartmentLead'
                : person?.id === 'leah'
                  ? 'TeamLead'
                  : 'Employee',
            organization: admin,
            effectiveVacationApproval: true,
            departments: fixtures.departments
              .filter(
                (d) =>
                  d.companyId === person?.companyId &&
                  (admin || (person?.id === 'ella' && d.id === person.departmentId)),
              )
              .map((d) => ({ ...d, guid: d.id, requireVacationApproval: null })),
            teams: fixtures.teams
              .filter(
                (t) =>
                  t.companyId === person?.companyId &&
                  (admin ||
                    (person?.id === 'ella' && t.departmentId === person.departmentId) ||
                    (person?.id === 'leah' && t.id === person.teamId)),
              )
              .map((t) => ({ ...t, guid: t.id, requireVacationApproval: null })),
          };
        },
      },
      currentUser: () => environment.VacateSession.currentUser(),
      decision: (id: string) => environment.VacateEligibility.decisionFor(id),
      balance: (id: string) =>
        environment.VacateEligibility.decisionFor(id).status === 'eligible'
          ? environment.VacateLeave.balanceOf(id)
          : null,
      label: (type: LeaveType) => environment.VacateLeave.typeLabel(type),
      visibleShortlist: () =>
        environment.VacateLeave.shortlistIds
          .map((id: string) => environment.VacateLeave.getType(id)!)
          .filter(
            (type: { id: string }) =>
              environment.VacateEligibility.decisionFor(type.id).status !== 'not-eligible',
          ),
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
      typeName: (id?: string) => {
        if (id === 'company-closure') return 'Company closure';
        const type = id && environment.VacateLeave.getType(id);
        return type ? environment.VacateLeave.typeLabel(type) : 'Leave';
      },
    };
  },
};

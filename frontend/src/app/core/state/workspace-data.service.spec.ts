import { TestBed } from '@angular/core/testing';
import { Person } from '../models/workspace.models';
import { WorkspaceApiService } from './workspace-api.service';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { WorkspaceDataService } from './workspace-data.service';

type WorkspaceApiTestDouble = Pick<WorkspaceApiService, 'profiles' | 'currentUser' | 'logout'> & {
  organization: ReturnType<typeof fixtureWorkspaceProvider.useFactory>['organization'];
  login: ReturnType<
    typeof fixtureWorkspaceProvider.useFactory
  >['environment']['VacateSession']['login'];
};

describe('Angular demo data boundary', () => {
  let data: WorkspaceDataService;
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WorkspaceApiService,
          useFactory: (): WorkspaceApiTestDouble => {
            const fixture = fixtureWorkspaceProvider.useFactory();
            return {
              profiles: fixture.profiles,
              organization: fixture.organization,
              currentUser: fixture.currentUser,
              login: fixture.environment.VacateSession.login,
              logout: fixture.environment.VacateSession.logout,
            };
          },
        },
      ],
    });
    data = TestBed.inject(WorkspaceDataService);
  });
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('keeps the approved shortlist order after filtering Ravi’s unavailable types', () => {
    data.environment.VacateSession.login('ravi', 'ravi');
    expect(data.visibleShortlist().map((type) => type.id)).toEqual([
      'annual',
      'sick',
      'paternity',
      'childcare',
      'parental',
      'school',
      'dependent-illness',
      'child-hospitalization',
      'voting',
      'study',
    ]);
  });

  it('keeps Maya’s own ledger separate from eligibility and country reference allowances', () => {
    data.environment.VacateSession.login('maya', 'maya');
    expect(data.balance('annual')?.available).toBe(14);
    expect(data.decision('childcare').status).toBe('eligible');
    expect(data.balance('childcare')).toBeNull();
    expect(data.decision('marriage').status).toBe('not-eligible');
    expect(data.visibleShortlist().some((type) => type.id === 'marriage')).toBe(false);
    expect(data.catalogue.getType('marriage')?.allowance).toContain('5 working days');
  });

  it('applies the confirmed zero-child default to Ella’s API-shaped own profile', () => {
    data.environment.VacateSession.login('ella', 'ella');
    expect(data.profiles.read()?.dependentChildren).toBe(0);
    expect(data.visibleShortlist().some((type) => type.id === 'childcare')).toBe(false);
    expect(data.decision('maternity').status).toBe('to-confirm');
  });

  it('does not return another account’s allocation from a forged company context', () => {
    const maya = data.fixtures.person('maya')!;
    data.environment.VacateSession = {
      currentUser: (): {
        companyId: string;
        id: string;
        personId: string;
        name: string;
        title: string;
        teamId: string;
        departmentId: string;
        team: string;
        capability: string;
        role: string;
        initials: string;
        username: string;
        email: string;
      } => ({ ...maya, companyId: 'foreign-company' }),
      login: (): false => false,
      logout: (): void => {},
    };
    expect(data.eligibility.getResponse()).toBeNull();
    expect(data.balance('annual')).toBeNull();
  });

  it('uses current API team membership consistently for own-team listings, filters and availability after reassignment', () => {
    data.environment.VacateSession.login('maya', 'maya');
    const original = data.currentUser()!;
    const moved = { ...original, teamId: 'platform', team: 'Platform' };
    vi.spyOn(data.api, 'currentUser').mockReturnValue(moved);
    Object.defineProperty(data.api, 'teamMembers', {
      configurable: true,
      value: [
        {
          username: 'maya@example.invalid',
          email: 'maya@example.invalid',
          firstName: 'Maya',
          middleName: null,
          lastName: 'Example',
          jobTitle: 'Engineer',
          systemRole: 'employee',
        },
        {
          username: 'ravi@example.invalid',
          email: 'ravi@example.invalid',
          firstName: 'Ravi',
          middleName: null,
          lastName: 'Example',
          jobTitle: 'Engineer',
          systemRole: 'employee',
        },
      ],
    });
    expect(data.myTeamPeople.map((person) => person.id)).toEqual(['maya', 'ravi']);
    expect(data.fixtures.peopleFor(moved, 'team').map((person) => person.id)).toEqual([
      'maya',
      'ravi',
    ]);
    expect(data.fixtures.allowedTeams(moved).map((team) => team.id)).toContain('platform');
    expect(data.fixtures.peopleFor(moved, 'self')).toEqual([moved]);
    expect(data.balance('annual')?.available).toBe(14);
    expect(data.fixtures.ownEntries(moved).every((entry) => entry.person === 'maya')).toBe(true);
    expect(
      new Set(data.fixtures.availabilityFor(moved, 'team').map((entry) => entry.person)),
    ).toEqual(new Set(['maya', 'ravi']));
    expect(data.fixtures.availabilityFor(moved, 'team')[0].type).toBeUndefined();
    expect(data.fixtures.peopleFor(moved, 'team', 'foreign-team')).toEqual([]);
    expect(data.fixtures.peopleFor({ ...moved, companyId: 'foreign-company' }, 'team')).toEqual([]);
    expect(data.fixtures.peopleFor(original, 'team').map((person) => person.id)).not.toContain(
      'ravi',
    );
    vi.restoreAllMocks();
  });

  it('stores display preferences by company and demo account and rejects stale-account writes', () => {
    data.environment.VacateSession.login('maya', 'maya');
    const maya = data.currentUser()!;
    const mayaPreferences = { layout: 'planner' as const, colorScheme: 'c' as const };
    expect(data.displayPreferences()).toEqual({ layout: 'calendar', colorScheme: 'a' });
    expect(data.saveDisplayPreferences(maya, mayaPreferences)).toEqual({ ok: true });
    expect(data.displayPreferences()).toEqual(mayaPreferences);
    expect(data.displayPreferences({ ...maya, companyId: 'foreign-company' })).toEqual({
      layout: 'calendar',
      colorScheme: 'a',
    });

    data.environment.VacateSession.logout();
    data.environment.VacateSession.login('nora', 'nora');
    const nora = data.currentUser()!;
    expect(data.displayPreferences()).toEqual({ layout: 'calendar', colorScheme: 'a' });
    expect(data.saveDisplayPreferences(maya, mayaPreferences)).toEqual({
      ok: false,
      error: 'Your account changed. Reopen settings before saving.',
    });

    data.environment.VacateSession.logout();
    data.environment.VacateSession.login('maya', 'maya');
    expect(data.displayPreferences()).toEqual(mayaPreferences);
    data.environment.VacateSession.logout();
    data.environment.VacateSession.login('nora', 'nora');
    expect(data.displayPreferences()).toEqual({ layout: 'calendar', colorScheme: 'a' });
    expect(nora.id).not.toBe(maya.id);
  });
});

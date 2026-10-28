import { TestBed } from '@angular/core/testing';
import { WorkspaceApiService } from './workspace-api.service';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { WorkspaceDataService } from './workspace-data.service';

describe('Angular demo data boundary', () => {
  let data: WorkspaceDataService;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WorkspaceApiService,
          useFactory: () => {
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
  afterEach(() => sessionStorage.clear());

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
      currentUser: () => ({ ...maya, companyId: 'foreign-company' }),
      login: () => false,
      logout: () => {},
    };
    expect(data.eligibility.getResponse()).toBeNull();
    expect(data.balance('annual')).toBeNull();
  });
});

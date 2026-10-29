import { TestBed } from '@angular/core/testing';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { createProfiles } from '../../../../testing/fixtures/profiles.js';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { MemberRecord } from '../../core/http/contracts';
import { AdminBalances } from './admin-balances';

describe('Administrator leave balances', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [AdminBalances],
      providers: [fixtureWorkspaceProvider],
    });
  });

  afterEach(() => sessionStorage.clear());

  function setup(account = 'nora') {
    const data = TestBed.inject(WorkspaceDataService);
    data.environment.VacateSession.login(account, account);
    const member = (id: string, remaining: number | null, companyId?: string) => {
      const person = data.fixtures.person(id)!;
      const profile = createProfiles({
        ...data.environment,
        VacateSession: { currentUser: () => person },
      }).read();
      const membership = profile.membership!;
      return {
        userId: profile.id,
        userGuid: profile.guid,
        person,
        membership: {
          ...membership,
          companyId: companyId || membership.companyId,
          balance: {
            ...membership.balance,
            allocation: remaining === null ? null : 20,
            available: remaining,
          },
        },
      } as MemberRecord;
    };
    data.api.members = [
      member('maya', 10),
      member('ravi', 18),
      member('sam', null),
      member('theo', 19, 'foreign-company'),
    ];
    const fixture = TestBed.createComponent(AdminBalances);
    fixture.detectChanges();
    return { data, fixture, page: fixture.componentInstance };
  }

  it('sorts known remaining values first, highlights the explicit threshold and excludes foreign-company records', async () => {
    const { page, fixture } = setup();
    expect(page.rows.map((row) => row.person.id)).toEqual(['ravi', 'maya', 'sam']);
    expect(fixture.nativeElement.querySelectorAll('.high-balance').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('To confirm');
    expect(fixture.nativeElement.textContent).not.toContain('Theo');
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input[type=number]') as HTMLInputElement;
    input.value = '95';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.high-balance').length).toBe(0);
  });

  it('filters by team and employee without treating unknown allocation as a high balance', () => {
    const { page } = setup();
    page.teamId = page.rows.find((row) => row.person.id === 'ravi')!.membership.teamId!;
    expect(page.rows.map((row) => row.person.id)).toEqual(['ravi']);
    page.teamId = '';
    page.search = ' MAYA ';
    expect(page.rows.map((row) => row.person.id)).toEqual(['maya']);
    expect(page.isHigh({ allocation: null, available: 20 })).toBe(false);
    expect(page.isHigh({ allocation: 0, available: 0 })).toBe(false);
    page.threshold = 0;
    expect(page.isHigh({ allocation: 20, available: null })).toBe(false);
  });

  it('denies employees and non-admin leads even when mounted directly with cached admin rows', () => {
    for (const account of ['maya', 'leah']) {
      const { page, fixture } = setup(account);
      expect(page.rows).toEqual([]);
      expect(fixture.nativeElement.querySelector('table')).toBeNull();
      fixture.destroy();
    }
  });
});

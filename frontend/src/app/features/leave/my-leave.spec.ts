import { TestBed } from '@angular/core/testing';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { MyLeave } from './my-leave';

describe('My Leave summary', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [MyLeave], providers: [fixtureWorkspaceProvider] });
  });

  afterEach(() => sessionStorage.clear());

  it('shows used recurring types, excludes event entitlements, retains pending history and sorts newest first', () => {
    const data = TestBed.inject(WorkspaceDataService);
    data.environment.VacateSession.login('maya', 'maya');
    const fixture = TestBed.createComponent(MyLeave);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page.usedTypes.map((type) => type.id)).toEqual(['annual', 'carer', 'school']);
    expect(page.entries.map((entry) => entry.start)).toEqual(
      [...page.entries.map((entry) => entry.start)].sort().reverse(),
    );
    expect(fixture.nativeElement.textContent).toContain('Pending approval');
    expect(fixture.nativeElement.querySelector('[data-used-balance="parental"]')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-used-balance="annual"]').textContent,
    ).toContain('17');
    expect(data.balance('annual')?.pending).toBe(3);
  });

  it('excludes other years from the used-type summary', () => {
    const data = TestBed.inject(WorkspaceDataService);
    data.environment.VacateSession.login('maya', 'maya');
    const fixture = TestBed.createComponent(MyLeave);
    const records = [
      {
        id: 'past',
        person: 'maya',
        companyId: 'northstar',
        start: '2025-01-01',
        end: '2025-01-02',
        type: 'study',
        status: 'Approved',
        title: 'Past',
      },
      {
        id: 'current',
        person: 'maya',
        companyId: 'northstar',
        start: '2026-01-01',
        end: '2026-01-02',
        type: 'annual',
        status: 'Approved',
        title: 'Own',
      },
    ];
    Object.defineProperty(data, 'fixtures', {
      value: { ...data.fixtures, ownEntries: () => records },
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.usedTypes.map((type) => type.id)).toEqual(['annual']);
  });
});

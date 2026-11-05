import { ComponentFixture, TestBed } from '@angular/core/testing';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { Balances } from './balances';

describe('Leave balance ordering', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Balances],
      providers: [fixtureWorkspaceProvider],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  function setup(account: string): { data: WorkspaceDataService; fixture: ComponentFixture<Balances>; page: Balances; } {
    const data = TestBed.inject(WorkspaceDataService);
    data.environment.VacateSession.login(account, account);
    const fixture = TestBed.createComponent(Balances);
    fixture.detectChanges();
    return { data, fixture, page: fixture.componentInstance };
  }

  it('surfaces parent-relevant balances and defers sick and rare event types', () => {
    const { data, page } = setup('maya');
    page.showAll = true;
    const groups = page.groups;
    const ids = groups.flatMap((group) => group.types.map((type) => type.id));

    expect(groups[0].name).toBe('At a glance');
    expect(groups[0].types.map((type) => type.id)).toEqual([
      'annual',
      'school',
      'childcare',
      'parental',
    ]);
    expect(ids.indexOf('sick')).toBeGreaterThan(ids.indexOf('annual'));
    expect(ids.slice(-5)).toEqual(['sick', 'maternity', 'paternity', 'voting', 'military']);
    expect(new Set(ids).size).toBe(data.catalogue.types.length);
    expect(
      data
        .visibleShortlist()
        .slice(0, 4)
        .map((type) => type.id),
    ).toEqual(['annual', 'sick', 'maternity', 'childcare']);
  });

  it('does not promote parent-specific balances for a non-parent account', () => {
    const { page } = setup('ella');
    page.showAll = true;
    const groups = page.groups;
    const ids = groups.flatMap((group) => group.types.map((type) => type.id));

    expect(groups[0].types.map((type) => type.id)).toEqual(['annual']);
    expect(ids.indexOf('school')).toBeGreaterThan(ids.indexOf('annual'));
    expect(ids.indexOf('childcare')).toBeGreaterThan(ids.indexOf('annual'));
    expect(ids.indexOf('parental')).toBeGreaterThan(ids.indexOf('annual'));
    expect(ids.slice(-5)).toEqual(['sick', 'maternity', 'paternity', 'voting', 'military']);
  });
});

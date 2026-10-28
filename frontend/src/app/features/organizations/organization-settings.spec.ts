import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { TestBed } from '@angular/core/testing';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { OrganizationSettings } from './organization-settings';

describe('OrganizationSettings administration', async () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [OrganizationSettings],
      providers: [fixtureWorkspaceProvider],
    });
  });
  afterEach(() => sessionStorage.clear());
  function setup(id = 'nora') {
    const data = TestBed.inject(WorkspaceDataService);
    data.environment.VacateSession.login(id, id);
    const fixture = TestBed.createComponent(OrganizationSettings);
    fixture.componentRef.setInput('companyId', 'northstar');
    fixture.detectChanges();
    return { data, fixture, page: fixture.componentInstance };
  }
  it('saves five/six-day company settings, cancels edits and rejects whitespace atomically', async () => {
    const { data, page } = setup();
    page.draft = { name: 'Edited organization', workWeekDays: 6 };
    await page.save();
    expect(data.companyName).toBe('Edited organization');
    expect(data.companyWorkWeekDays).toBe(6);
    page.draft.name = 'Unsaved';
    page.reset();
    expect(page.draft.name).toBe('Edited organization');
    page.draft = { name: ' ', workWeekDays: 5 };
    await page.save();
    expect(page.error).toContain('name');
    expect(data.companyWorkWeekDays).toBe(6);
  });
  it('browses department/team members and renames only the selected entity', async () => {
    const { data, page } = setup();
    page.openDepartment('technology');
    page.nodeName = 'Engineering';
    await page.rename();
    expect(data.groupName('department', 'technology')).toBe('Engineering');
    page.openTeam('technology', 'platform');
    expect(page.team?.members.length).toBe(3);
    page.nodeName = 'Core Platform';
    await page.rename();
    expect(data.groupName('team', 'platform')).toBe('Core Platform');
    expect(data.groupName('team', 'applications')).toBe('Applications');
    page.openTeam('business', 'platform');
    expect(page.departmentId).toBe('technology');
  });
  it('renders no structure or edit controls for an employee or non-admin lead', async () => {
    const { data, fixture, page } = setup('leah');
    expect(page.record).toBeNull();
    expect(fixture.nativeElement.querySelector('#organization-form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Admin access only');
    data.environment.VacateSession.login('maya', 'maya');
    page.reset();
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(page.record).toBeNull();
  });
  it('rejects foreign company input and stale administrator forms', async () => {
    const { data, fixture, page } = setup();
    fixture.componentRef.setInput('companyId', 'foreign');
    fixture.detectChanges();
    expect(page.record).toBeNull();
    fixture.componentRef.setInput('companyId', 'northstar');
    fixture.detectChanges();
    data.environment.VacateSession.login('daria', 'daria');
    page.draft.name = 'Stale';
    await page.save();
    expect(page.record).toBeNull();
    expect(data.companyName).toBe('Northstar Example');
  });

  it('renders a flat organization and a direct team without inventing department levels', async () => {
    const data = TestBed.inject(WorkspaceDataService);
    data.environment.VacateSession.login('nora', 'nora');
    const snapshot = data.organization.read('northstar')!;
    let flat: typeof snapshot = { ...snapshot, departments: [], teams: [] };
    Object.defineProperty(data, 'organization', {
      value: { ...data.organization, read: () => flat },
    });
    const fixture = TestBed.createComponent(OrganizationSettings);
    fixture.componentRef.setInput('companyId', 'northstar');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.record?.departments.length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No departments or teams.');
    expect(
      fixture.nativeElement.querySelectorAll('.org-direct-members .org-members li').length,
    ).toBe(12);
    flat = {
      ...flat,
      teams: [
        {
          ...snapshot.teams[0],
          id: 'direct',
          name: 'Direct team',
          departmentId: null,
          members: snapshot.members,
        },
      ],
    };
    (fixture.nativeElement.querySelector('.org-breadcrumb button') as HTMLButtonElement).click();
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('[data-org-team=direct]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.department).toBeUndefined();
    expect(fixture.componentInstance.team?.name).toBe('Direct team');
    expect(fixture.nativeElement.querySelectorAll('.org-members li').length).toBe(12);
  });
});

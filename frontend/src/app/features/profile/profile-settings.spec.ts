import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { TestBed } from '@angular/core/testing';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { ProfileSettings } from './profile-settings';

describe('Own profile settings', async () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ProfileSettings],
      providers: [fixtureWorkspaceProvider],
    });
  });
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  function setup(id = 'maya') {
    const data = TestBed.inject(WorkspaceDataService);
    data.environment.VacateSession.login(id, id);
    const fixture = TestBed.createComponent(ProfileSettings);
    fixture.detectChanges();
    return { data, fixture, page: fixture.componentInstance };
  }
  it('rejects incompatible family facts atomically and resets drafts to the saved profile', async () => {
    const { data, page } = setup();
    page.draft.soleCare = true;
    await page.submit();
    expect(page.error).toContain('cannot both');
    expect(data.profiles.read()?.soleCare).toBe(false);
    page.reset();
    expect(page.draft.soleCare).toBe(false);
    page.draft.firstName = 'Updated';
    await page.submit();
    page.draft.firstName = 'Unsaved';
    page.reset();
    expect(page.draft.firstName).toBe('Updated');
  });
  it('renders membership without editing controls even for administrators and handles unassigned membership', async () => {
    const { fixture, page } = setup('nora');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector(
        '.membership-card input, .membership-card select, .membership-card button',
      ),
    ).toBeNull();
    expect(fixture.nativeElement.querySelector('.membership-card').textContent).toContain('Admin');
    page.profile = { ...page.profile!, membership: null };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.membership-card').textContent).toContain(
      'No company membership assigned',
    );
  });
  it('refuses saving a stale form after an account switch and clears earlier edits on logout', async () => {
    const { data, page } = setup();
    page.draft.firstName = 'Temporary';
    await page.submit();
    data.environment.VacateSession.logout();
    data.environment.VacateSession.login('nora', 'nora');
    page.draft.firstName = 'Wrong account';
    await page.submit();
    expect(page.error).toContain('account changed');
    expect(data.profiles.read()?.firstName).toBe('Nora');
    data.environment.VacateSession.login('maya', 'maya');
    expect(data.profiles.read()?.firstName).toBe('Maya');
  });

  it('saves the chosen layout and color scheme for the current browser account', () => {
    const { data, fixture, page } = setup();
    page.displayPreferences = { layout: 'planner', colorScheme: 'c' };
    page.saveDisplayPreferences();
    fixture.detectChanges();

    expect(data.displayPreferences()).toEqual({ layout: 'planner', colorScheme: 'c' });
    expect(fixture.nativeElement.querySelector('#display-preferences-status').textContent).toContain(
      'saved in this browser',
    );
    expect(fixture.nativeElement.querySelector('#display-layout').value).toBe('planner');
    expect(fixture.nativeElement.querySelector('#display-color-scheme').value).toBe('c');
  });
});

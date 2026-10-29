import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { Workspace } from './workspace';

describe('Workspace navigation', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [
        fixtureWorkspaceProvider,
        provideRouter([
          { path: 'index.html', component: Workspace },
          { path: 'people', component: Workspace },
          { path: 'leave', component: Workspace },
        ]),
      ],
    });
  });

  afterEach(() => sessionStorage.clear());

  async function setup(url: string, account = 'nora') {
    const data = TestBed.inject(WorkspaceDataService);
    data.environment.VacateSession.login(account, account);
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(url, Workspace);
    return { page, harness, element: harness.routeNativeElement! };
  }

  it('has one Settings entry, no separate organization or personal balance entry and sign-out only in the profile menu', async () => {
    const { page, harness, element } = await setup('/index.html?page=settings');
    expect(element.querySelectorAll('nav#navigation [data-nav="settings"]').length).toBe(1);
    expect(element.querySelector('[data-nav="organization-settings"]')).toBeNull();
    expect(element.querySelector('nav#navigation [data-nav="balances"]')).toBeNull();
    expect(element.querySelectorAll('.settings-navigation button').length).toBe(3);
    expect(element.querySelector('.company')).toBeNull();
    expect(element.querySelector('.topbar [data-action="logout"]')).toBeNull();
    page.accountOpen = true;
    page.changeDetector.markForCheck();
    harness.detectChanges();
    expect(element.querySelector('#account-dropdown [data-action="logout"]')).not.toBeNull();
  });

  it('resolves legacy organization links within Settings and preserves organization authorization', async () => {
    const { page, element } = await setup('/index.html?page=organization', 'maya');
    expect(page.state.page).toBe('settings');
    expect(page.settingsSection).toBe('organization');
    expect(element.querySelector('#organization-denied')).not.toBeNull();
    expect(element.querySelector('#organization-form')).toBeNull();
  });

  it('shows the unavailable approval inbox without revealing reference pending requests', async () => {
    const { element } = await setup('/index.html?page=approvals');
    expect(element.textContent).toContain('Approval inbox unavailable');
    expect(element.querySelector('main vacate-balances')).toBeNull();
    expect(element.querySelector('main .navigation-card')!.textContent).not.toContain('Maya');
  });

  it('opens My Leave from its route with own request history and a personal balances link', async () => {
    const { page, element } = await setup('/leave', 'maya');
    expect(page.state.page).toBe('leave');
    expect(element.querySelector('.navigation-card')!.textContent).toContain('My requests');
    expect(element.querySelector('.navigation-card [data-nav="balances"]')).not.toBeNull();
    expect(element.querySelector('vacate-organization')).toBeNull();
  });
});

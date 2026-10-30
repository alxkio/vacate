import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { firstValueFrom, filter } from 'rxjs';
import { NavigationEnd, Router, provideRouter } from '@angular/router';
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
        provideLocationMocks(),
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

  it.each(['applications', 'foreign-team'])(
    'retains the calendar period and authorized group through My Leave, balances and history (%s)',
    async (group) => {
      const { page } = await setup(
        `/index.html?scope=team&group=${group}&view=week&date=2026-11-05`,
        'maya',
      );
      const router = TestBed.inject(Router);
      router.setUpLocationChangeListener();
      const location = TestBed.inject(Location);
      const assertPeriod = (expectedPage: string) => {
        expect(page.state.page).toBe(expectedPage);
        expect(page.period).toBe('2 Nov – 8 Nov 2026');
        expect(page.state.scope).toBe('team');
        expect(page.state.groupId).toBe(group);
        expect(page.visiblePeople.length).toBe(group === 'applications' ? 3 : 0);
        expect(new URLSearchParams(router.url.split('?')[1]).get('date')).toBe('2026-11-05');
      };
      const traverse = async (direction: 'back' | 'forward') => {
        const finished = firstValueFrom(
          router.events.pipe(filter((event) => event instanceof NavigationEnd)),
        );
        location[direction]();
        await finished;
      };
      assertPeriod('calendar');
      await page.navigatePage('leave');
      assertPeriod('leave');
      await page.navigatePage('balances');
      assertPeriod('balances');
      await traverse('back');
      assertPeriod('leave');
      await traverse('back');
      assertPeriod('calendar');
      await traverse('forward');
      assertPeriod('leave');
      await traverse('forward');
      assertPeriod('balances');
    },
  );
});

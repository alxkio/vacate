import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { filter, firstValueFrom } from 'rxjs';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { routes } from '../../app.routes';
import { RouterTestingHarness } from '@angular/router/testing';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import {
  currentDate,
  dateKey,
  WorkspaceDataService,
} from '../../core/state/workspace-data.service';
import { Workspace } from './workspace';

describe('Workspace navigation', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [fixtureWorkspaceProvider, provideLocationMocks(), provideRouter(routes)],
    });
  });

  afterEach(() => sessionStorage.clear());

  async function setup(
    url: string,
    account = 'nora',
  ): Promise<{ page: Workspace; harness: RouterTestingHarness; element: HTMLElement }> {
    const data = TestBed.inject(WorkspaceDataService);
    data.environment.VacateSession.login(account, account);
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(url, Workspace);
    return { page, harness, element: harness.routeNativeElement! };
  }

  it('opens today by default and renders an explicit historical date for fixture journeys', async () => {
    const { page, harness } = await setup('/index.html?scope=self&view=month', 'maya');
    expect(dateKey(page.state.date)).toBe(dateKey(currentDate()));
    await harness.navigateByUrl('/index.html?scope=self&view=month&date=2026-10-01', Workspace);
    expect(harness.routeNativeElement?.querySelector('#period')?.textContent).toContain(
      'October 2026',
    );
    expect(harness.routeNativeElement?.querySelector('[data-date="2026-10-01"]')).not.toBeNull();
  });

  it('has one Settings entry, no separate organization or personal balance entry and sign-out only in the profile menu', async () => {
    const { page, harness, element } = await setup('/index.html?page=settings');
    expect(element.querySelectorAll('nav#navigation [data-nav="settings"]').length).toBe(1);
    expect(element.querySelector('[data-nav="organization-settings"]')).toBeNull();
    expect(element.querySelector('nav#navigation [data-nav="balances"]')).toBeNull();
    expect(
      Array.from(element.querySelectorAll('.settings-navigation button'), (button) =>
        button.getAttribute('data-settings-section'),
      ),
    ).toEqual(['organization', 'department', 'team', 'profile', 'system']);
    expect(element.querySelector('#workspace-organization')?.textContent).toContain(
      'Northstar Example',
    );
    expect(element.querySelector('#demo-person')).toBeNull();
    expect(element.querySelector('.topbar [data-action="logout"]')).toBeNull();
    page.accountOpen = true;
    page.changeDetector.markForCheck();
    harness.detectChanges();
    expect(element.querySelector('#account-dropdown [data-action="logout"]')).not.toBeNull();
  });

  it.each(['maya', 'ravi', 'sam'])(
    'limits %s to Profile/System and redirects restricted query, direct-route and legacy settings links',
    async (account) => {
      const { harness } = await setup('/index.html?page=settings', account);
      const router = TestBed.inject(Router);
      for (const url of [
        '/index.html?page=settings&section=organization',
        '/index.html?page=settings&section=team',
        '/index.html?page=organization',
        '/index.html?page=organization-settings',
        '/settings?section=organization',
        '/settings?section=team',
      ]) {
        const page = await harness.navigateByUrl(url, Workspace);
        const params = router.parseUrl(router.url).queryParams;
        expect(params['page']).toBe('settings');
        expect(params['section']).toBe('profile');
        expect(page.settingsSection).toBe('profile');
        const element = harness.routeNativeElement!;
        expect(
          Array.from(element.querySelectorAll('.settings-navigation button'), (button) =>
            button.getAttribute('data-settings-section'),
          ),
        ).toEqual(['profile', 'system']);
        expect(
          element.querySelector(
            'vacate-organization, [data-settings-section="team"], [data-settings-section="organization"]',
          ),
        ).toBeNull();
        expect(element.querySelector('#profile-form')).not.toBeNull();
        expect(element.querySelector('#display-preferences-form')).toBeNull();
      }
    },
  );

  it('keeps display preferences in System and prevents an employee selecting restricted sections imperatively', async () => {
    const { page, harness } = await setup('/settings?section=system', 'maya');
    expect(page.settingsSection).toBe('system');
    expect(harness.routeNativeElement!.querySelector('#display-preferences-form')).not.toBeNull();
    expect(harness.routeNativeElement!.querySelector('#profile-form, .membership-card')).toBeNull();
    await page.selectSettingsSection('team');
    harness.detectChanges();
    expect(page.settingsSection).toBe('profile');
    expect(harness.routeNativeElement!.querySelector('#profile-form')).not.toBeNull();
    expect(harness.routeNativeElement!.querySelector('vacate-organization')).toBeNull();
  });

  it('retains admin organization/legacy access and rejects foreign organization/team settings', async () => {
    const { page, harness } = await setup('/index.html?page=organization');
    expect(page.settingsSection).toBe('organization');
    expect(harness.routeNativeElement!.querySelector('#organization-form')).not.toBeNull();
    for (const section of ['organization', 'team']) {
      await harness.navigateByUrl(
        `/index.html?page=settings&section=${section}&company=foreign`,
        Workspace,
      );
      expect(
        harness.routeNativeElement!.querySelector(
          '#organization-form, [data-org-team], .dialog-list',
        ),
      ).toBeNull();
      expect(harness.routeNativeElement!.textContent).toContain(
        section === 'organization' ? 'Admin access only' : 'Team unavailable',
      );
    }
  });

  it('shows assigned inbox recovery without revealing reference pending requests', async () => {
    const { element } = await setup('/index.html?page=approvals');
    expect(element.textContent).toContain('Assigned approval requests');
    expect(element.textContent).toContain('Assigned requests could not be loaded');
    expect(element.querySelector('main vacate-balances')).toBeNull();
    expect(element.querySelector('main .navigation-card')!.textContent).not.toContain('Maya');
  });

  it('opens My Leave from its route with own request history and a personal balances link', async () => {
    const { page, element } = await setup('/leave', 'maya');
    expect(page.state.page).toBe('leave');
    expect(element.querySelector('vacate-my-leave')!.textContent).toContain('My requests');
    expect(element.querySelector('.navigation-card [data-nav="balances"]')).not.toBeNull();
    expect(element.querySelector('vacate-organization')).toBeNull();
  });

  it('opens request details and selected-date details in the dialog and restores focus on close', async () => {
    const { page, harness, element } = await setup('/index.html', 'maya');
    const dialog = element.querySelector<HTMLDialogElement>('#dialog')!;
    Object.defineProperty(dialog, 'showModal', {
      configurable: true,
      value: () => dialog.setAttribute('open', ''),
    });
    Object.defineProperty(dialog, 'close', {
      configurable: true,
      value: () => {
        dialog.removeAttribute('open');
        dialog.dispatchEvent(new Event('close'));
      },
    });
    const trigger = element.querySelector<HTMLButtonElement>('.upcoming-event')!;

    trigger.click();
    harness.detectChanges();
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-labelledby')).toBe('workspace-dialog-title');
    expect(dialog.querySelector('#workspace-dialog-title')?.textContent?.trim()).toBeTruthy();
    expect(dialog.textContent).toContain('YOUR REQUEST');
    expect(dialog.textContent).toContain('Parental leave');

    page.workspaceDialog.showDate(new Date(2026, 9, 26), trigger);
    harness.detectChanges();
    expect(page.selectedDate).toEqual(new Date(2026, 9, 26));
    expect(dialog.textContent).toContain('26 October 2026');
    expect(dialog.textContent).toContain('Annual leave · Pending');

    page.workspaceDialog.close();
    expect(document.activeElement).toBe(trigger);
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
      const assertPeriod = (expectedPage: string): void => {
        expect(page.state.page).toBe(expectedPage);
        expect(page.period).toBe('2 Nov – 8 Nov 2026');
        expect(page.state.scope).toBe('team');
        expect(page.state.groupId).toBe(group);
        expect(page.visiblePeople.length).toBe(group === 'applications' ? 3 : 0);
        expect(new URLSearchParams(router.url.split('?')[1]).get('date')).toBe('2026-11-05');
      };
      const traverse = async (direction: 'back' | 'forward'): Promise<void> => {
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

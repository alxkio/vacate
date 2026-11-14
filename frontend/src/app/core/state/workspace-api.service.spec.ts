import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RUNTIME_CONFIG } from '../http/runtime-config';
import { WorkspaceApiService } from './workspace-api.service';
import { createFixtures } from '../reference-data/fixtures.js';
import { createProfiles } from '../../../../testing/fixtures/profiles.js';
import { OwnProfile, Person } from '../models/workspace.models';
import { SessionNavigation } from '../http/session-navigation';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
describe('API-backed demo state', () => {
  let http: HttpTestingController;
  let api: WorkspaceApiService;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RUNTIME_CONFIG, useValue: { apiBaseUrl: '/api', revision: 'test' } },
        {
          provide: SessionNavigation,
          useValue: {
            expired: (token: string) => {
              if (sessionStorage.getItem('vacate.session.token') === token) {
                sessionStorage.removeItem('vacate.session.token');
              }
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(WorkspaceApiService);
  });
  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });
  function own(id = 'maya'): { profile: OwnProfile; person: Person } {
    const f = createFixtures();
    const person = f.person(id)!;
    const profile = createProfiles({
      VacateFixtures: f,
      VacateSession: { currentUser: () => person },
    }).read() as OwnProfile;
    return { profile, person: { ...person, companyId: profile.membership!.companyId } as Person };
  }
  async function signIn(): Promise<void> {
    const result = api.login('maya', 'maya');
    http.expectOne('/api/auth/sessions').flush({ accessToken: 'server-token' });
    await tick();
    const current = http.expectOne('/api/auth/sessions/current');
    expect(current.request.headers.get('Authorization')).toBe('Bearer server-token');
    current.flush(own());
    await tick();
    http
      .expectOne('/api/organizations/20000000-0000-4000-8000-000000000100/summary')
      .flush({ name: 'From API', workWeekDays: 6 });
    expect(await result).toBe(true);
  }
  it('uses server sign-in, bearer authorization and own response instead of browser account keys', async () => {
    sessionStorage.setItem('vacate.demo.account.v2', 'nora');
    expect(api.currentUser()).toBeNull();
    await signIn();
    expect(api.currentUser()?.id).toBe('maya');
    expect(api.profiles.read()?.firstName).toBe('Maya');
    expect(api.organization.summary()?.workWeekDays).toBe(6);
    expect(api.organization.read('northstar')).toBeNull();
  });
  it('does not commit failed saves locally and exposes the server validation error', async () => {
    await signIn();
    const result = api.profiles.update('maya', { firstName: 'Lost', soleCare: true });
    const patch = http.expectOne('/api/users/20000000-0000-4000-8000-000000000004');
    expect(patch.request.method).toBe('PATCH');
    patch.flush(
      { error: 'Married and sole care cannot both be selected.' },
      { status: 400, statusText: 'Bad Request' },
    );
    expect((await result).ok).toBe(false);
    expect(api.profiles.read()?.firstName).toBe('Maya');
  });
  it('refreshes saved profile over HTTP and leaves the configured membership intact', async () => {
    await signIn();
    const result = api.profiles.update('maya', { firstName: 'Edited' });
    http.expectOne('/api/users/20000000-0000-4000-8000-000000000004').flush({});
    await tick();
    const response = own();
    response.profile.firstName = 'Edited';
    http.expectOne('/api/auth/sessions/current').flush(response);
    await tick();
    http
      .expectOne('/api/organizations/20000000-0000-4000-8000-000000000100/summary')
      .flush({ name: 'From API', workWeekDays: 6 });
    expect((await result).ok).toBe(true);
    expect(api.profiles.read()?.firstName).toBe('Edited');
    expect(api.profiles.read()?.membership?.companyId).toBe(response.profile.membership!.companyId);
  });
  it('does not restore a stale response after sign-out and refuses stale-account writes', async () => {
    await signIn();
    const result = api.profiles.update('maya', { firstName: 'Late' });
    const patch = http.expectOne('/api/users/20000000-0000-4000-8000-000000000004');
    api.logout();
    http.expectOne('/api/auth/sessions/current').flush(null);
    patch.flush({});
    expect((await result).ok).toBe(false);
    expect(api.profiles.read()).toBeNull();
    expect((await api.profiles.update('maya', { firstName: 'Stale' })).ok).toBe(false);
  });
  it('fails sign-in visibly when the API is unavailable without using local fixtures as credentials', async () => {
    const result = api.login('maya', 'maya');
    http
      .expectOne('/api/auth/sessions')
      .flush({ error: 'Unavailable' }, { status: 503, statusText: 'Unavailable' });
    expect(await result).toBe(false);
    expect(api.currentUser()).toBeNull();
    expect(api.error).toContain('API');
  });

  it.each([0, 503])(
    'retains a saved ticket after startup status %s and reconnects without another sign-in',
    async (status) => {
      sessionStorage.setItem('vacate.session.token', 'saved-ticket');
      api = TestBed.runInInjectionContext(() => new WorkspaceApiService());
      const initialization = api.initialize();
      const failed = http.expectOne('/api/auth/sessions/current');
      if (status === 0) failed.error(new ProgressEvent('error'));
      else failed.flush({}, { status, statusText: 'Unavailable' });
      await initialization;
      expect(sessionStorage.getItem('vacate.session.token')).toBe('saved-ticket');
      expect(api.sessionRecoveryAvailable).toBe(true);
      expect(api.currentUser()).toBeNull();
      expect(api.profiles.read()).toBeNull();

      const recovery = api.restoreSession();
      const current = http.expectOne('/api/auth/sessions/current');
      expect(current.request.headers.get('Authorization')).toBe('Bearer saved-ticket');
      current.flush(own());
      await tick();
      http
        .expectOne('/api/organizations/20000000-0000-4000-8000-000000000100/summary')
        .flush({ name: 'Restored' });
      expect(await recovery).toBe(true);
      expect(api.currentUser()?.id).toBe('maya');
      expect(api.sessionRecoveryAvailable).toBe(false);
      expect(api.error).toBe('');
    },
  );

  it('does not expose a partially loaded account when the company summary fails', async () => {
    sessionStorage.setItem('vacate.session.token', 'saved-ticket');
    api = TestBed.runInInjectionContext(() => new WorkspaceApiService());
    const initialization = api.initialize();
    http.expectOne('/api/auth/sessions/current').flush(own());
    await tick();
    http
      .expectOne('/api/organizations/20000000-0000-4000-8000-000000000100/summary')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    await initialization;
    expect(api.profiles.read()).toBeNull();
    expect(api.organization.summary()).toBeNull();
    expect(api.currentUser()).toBeNull();
    expect(api.sessionRecoveryAvailable).toBe(true);
    expect(sessionStorage.getItem('vacate.session.token')).toBe('saved-ticket');
  });

  it('clears a genuinely expired saved session instead of offering recovery', async () => {
    sessionStorage.setItem('vacate.session.token', 'expired-ticket');
    api = TestBed.runInInjectionContext(() => new WorkspaceApiService());
    const initialization = api.initialize();
    http
      .expectOne('/api/auth/sessions/current')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await initialization;
    expect(sessionStorage.getItem('vacate.session.token')).toBeNull();
    expect(api.sessionRecoveryAvailable).toBe(false);
    expect(api.currentUser()).toBeNull();
    expect(api.error).toContain('session ended');
  });

  it('retains a newly issued ticket if loading the workspace fails after successful sign-in', async () => {
    const result = api.login('maya', 'maya');
    http.expectOne('/api/auth/sessions').flush({ accessToken: 'new-ticket' });
    await tick();
    http
      .expectOne('/api/auth/sessions/current')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(await result).toBe(false);
    expect(sessionStorage.getItem('vacate.session.token')).toBe('new-ticket');
    expect(api.sessionRecoveryAvailable).toBe(true);
    expect(api.currentUser()).toBeNull();
  });

  it.each([403, 404])(
    'does not sign out the account when a save is denied with %s',
    async (status) => {
      await signIn();
      const result = api.profiles.update('maya', { firstName: 'Denied' });
      http
        .expectOne('/api/users/20000000-0000-4000-8000-000000000004')
        .flush({ error: 'Denied' }, { status, statusText: 'Denied' });
      expect((await result).ok).toBe(false);
      expect(api.currentUser()?.id).toBe('maya');
      expect(sessionStorage.getItem('vacate.session.token')).toBe('server-token');
      expect(api.profiles.read()?.firstName).toBe('Maya');
    },
  );

  it('ignores a late failed restoration after another account signs in', async () => {
    await signIn();
    const oldRestore = api.restoreSession();
    const oldRequest = http.expectOne('/api/auth/sessions/current');
    const replacement = api.login('ravi', 'ravi');
    http.expectOne({ method: 'DELETE', url: '/api/auth/sessions/current' }).flush(null);
    http.expectOne('/api/auth/sessions').flush({ accessToken: 'ravi-ticket' });
    await tick();
    http.expectOne('/api/auth/sessions/current').flush(own('ravi'));
    await tick();
    http
      .expectOne('/api/organizations/20000000-0000-4000-8000-000000000100/summary')
      .flush({ name: 'Ravi company' });
    expect(await replacement).toBe(true);
    oldRequest.flush({}, { status: 503, statusText: 'Unavailable' });
    expect(await oldRestore).toBe(false);
    expect(api.currentUser()?.id).toBe('ravi');
    expect(api.sessionRecoveryAvailable).toBe(false);
    expect(api.error).toBe('');
  });

  it('shares overlapping restorations for the same ticket so an older request cannot discard a newer result', async () => {
    await signIn();
    const first = api.restoreSession();
    const second = api.restoreSession();
    const requests = http.match('/api/auth/sessions/current');
    expect(requests).toHaveLength(1);
    requests[0].flush(own());
    await tick();
    http
      .expectOne('/api/organizations/20000000-0000-4000-8000-000000000100/summary')
      .flush({ name: 'Restored' });
    expect(await first).toBe(true);
    expect(await second).toBe(true);
    expect(api.currentUser()?.id).toBe('maya');
    expect(api.sessionRecoveryAvailable).toBe(false);
  });
});

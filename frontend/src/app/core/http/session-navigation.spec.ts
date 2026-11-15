import {
  safeReturnUrl,
  loginUrl,
  expiredSessionUrl,
  SessionNavigation,
} from './session-navigation';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { ApiClient } from './api-client';
import { RUNTIME_CONFIG } from './runtime-config';

describe('Session expiry navigation', () => {
  it('retains the original internal destination when a saved-session retry expires on Login', () => {
    const destination = '/index.html?page=people&scope=org';
    const result = new URL(expiredSessionUrl(loginUrl(destination)), 'https://vacate.invalid');
    expect(result.pathname).toBe('/login');
    expect(result.searchParams.get('returnUrl')).toBe(destination);
    expect(result.searchParams.get('reason')).toBe('expired');
    const unsafe = new URL(
      expiredSessionUrl('/login.html?returnUrl=https://evil.invalid'),
      'https://vacate.invalid',
    );
    expect(unsafe.searchParams.get('returnUrl')).toBe('/calendar');
  });
  it('preserves internal page state and rejects external, encoded or malformed redirect destinations', () => {
    expect(safeReturnUrl('/index.html?page=people&scope=org')).toBe(
      '/index.html?page=people&scope=org',
    );
    expect(loginUrl('/settings?section=system')).toContain(
      encodeURIComponent('/settings?section=system'),
    );
    for (const value of [
      'https://evil.invalid',
      '//evil.invalid',
      '/\\evil.invalid',
      '/login.html',
      '/%2f%2fevil.invalid',
      'javascript:alert(1)',
      null,
    ])
      expect(safeReturnUrl(value)).toBe('/calendar');
  });

  it('resumes only recognised GUID resource paths and clean feature paths', () => {
    const guid = '10000000-0000-4000-8000-000000000001';
    for (const path of [
      `/people/${guid}`,
      `/people/${guid}/memberships/${guid}`,
      `/people/${guid}/leave?year=2026`,
      `/leave/requests/${guid}`,
      `/approvals/${guid}`,
      '/calendar?scope=team&view=week&date=2026-11-14',
      '/settings/profile',
      '/help',
    ]) {
      expect(safeReturnUrl(path)).toBe(path);
      const login = new URL(loginUrl(path), 'https://vacate.invalid');
      expect(login.pathname).toBe('/login');
      expect(login.searchParams.get('returnUrl')).toBe(path);
    }
    for (const path of [
      '/people/maya',
      '/people/42',
      '/people/%2f%2fevil.invalid',
      '/home',
      '/settings/arbitrary',
    ])
      expect(safeReturnUrl(path)).toBe('/calendar');
  });

  it('redirects authenticated 401 errors, while login errors and forbidden responses remain local', () => {
    const expired = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RUNTIME_CONFIG, useValue: { apiBaseUrl: '/api' } },
        { provide: SessionNavigation, useValue: { expired } },
      ],
    });
    const api = TestBed.inject(ApiClient);
    const http = TestBed.inject(HttpTestingController);
    for (const [token, status] of [
      ['current', 401],
      ['', 401],
      ['current', 403],
    ] as const) {
      api.request('GET', 'test', token).subscribe({ error: () => {} });
      http.expectOne('/api/test').flush({}, { status, statusText: 'Denied' });
    }
    expect(expired).toHaveBeenCalledExactlyOnceWith('current');
    http.verify();
  });

  it('ignores expiry from another account or a signed-out session', () => {
    sessionStorage.setItem('vacate.session.token', 'new-account');
    new SessionNavigation().expired('old-account');
    expect(sessionStorage.getItem('vacate.session.token')).toBe('new-account');
    sessionStorage.clear();
  });
});

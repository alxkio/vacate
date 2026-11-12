import { safeReturnUrl, loginUrl, SessionNavigation } from './session-navigation';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { ApiClient } from './api-client';
import { RUNTIME_CONFIG } from './runtime-config';

describe('Session expiry navigation', () => {
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
      expect(safeReturnUrl(value)).toBe('/index.html');
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

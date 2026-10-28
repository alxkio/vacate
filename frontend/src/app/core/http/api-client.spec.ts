import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiClient } from './api-client';
import { parseRuntimeConfig, RUNTIME_CONFIG } from './runtime-config';

describe('Cloud API configuration', () => {
  it('sends requests to the configured API origin', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: RUNTIME_CONFIG,
          useValue: parseRuntimeConfig({
            apiBaseUrl: 'https://vacate.azurewebsites.net/api/',
            revision: 'test',
          }),
        },
      ],
    });
    let status: string | undefined;
    TestBed.inject(ApiClient)
      .health()
      .subscribe((response) => (status = response.status));
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('https://vacate.azurewebsites.net/api/health')
      .flush({ status: 'healthy', version: 'test' });
    expect(status).toBe('healthy');
    http.verify();
  });

  it('keeps the local proxy path', () => {
    expect(parseRuntimeConfig({ apiBaseUrl: '/api', revision: 'local' }).apiBaseUrl).toBe('/api');
  });

  it('rejects insecure or malformed deployment configuration', () => {
    for (const apiBaseUrl of [
      'http://example.com/api',
      '//example.com/api',
      'https://example.com/api?token=secret',
      'https://user:secret@example.com/api',
      'https://example.com',
    ]) {
      expect(() => parseRuntimeConfig({ apiBaseUrl, revision: 'test' })).toThrow();
    }
    expect(() => parseRuntimeConfig(null)).toThrow();
  });
});

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RUNTIME_CONFIG } from './runtime-config';

export type HealthResponse = {
  status: string;
  version: string;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);

  request<T>(method: string, path: string, token: string, body?: unknown): Observable<T> {
    return this.http.request<T>(method, `${this.config.apiBaseUrl}/${path}`, {
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  health(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.config.apiBaseUrl}/health`);
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { SessionNavigation } from './session-navigation';
import { RUNTIME_CONFIG } from './runtime-config';

export type HealthResponse = {
  status: string;
  version: string;
};

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly navigation = inject(SessionNavigation);
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);

  request<T>(method: string, path: string, token: string, body?: unknown): Observable<T> {
    return this.http
      .request<T>(method, `${this.config.apiBaseUrl}/${path}`, {
        body,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401 && token) this.navigation.expired(token);
          return throwError(() => error);
        }),
      );
  }

  health(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.config.apiBaseUrl}/health`);
  }
}

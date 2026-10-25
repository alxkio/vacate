import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RUNTIME_CONFIG } from './runtime-config';

export interface HealthResponse {
  status: string;
  version: string;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);

  health() {
    return this.http.get<HealthResponse>(`${this.config.apiBaseUrl}/health`);
  }
}

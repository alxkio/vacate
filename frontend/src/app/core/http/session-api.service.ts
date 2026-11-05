import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { CurrentSession, SignInResult } from './contracts';
@Injectable({ providedIn: 'root' })
export class SessionApiService {
  private readonly api = inject(ApiClient);

  signIn(username: string, password: string): Observable<SignInResult> {
    return this.api.request<SignInResult>('POST', 'auth/sessions', '', { username, password });
  }

  current(token: string): Observable<CurrentSession> {
    return this.api.request<CurrentSession>('GET', 'auth/sessions/current', token);
  }

  signOut(token: string): Observable<void> {
    return this.api.request<void>('DELETE', 'auth/sessions/current', token);
  }
}

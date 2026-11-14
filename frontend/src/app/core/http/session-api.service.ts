import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { CurrentSession, SignInResult } from './contracts';
@Injectable({ providedIn: 'root' })
export class SessionApiService {
  private readonly api = inject(ApiClient);

  accounts(): Observable<{ id: string; name: string; label: string; team: string }[]> {
    return this.api.request('GET', 'auth/development-accounts', '');
  }

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

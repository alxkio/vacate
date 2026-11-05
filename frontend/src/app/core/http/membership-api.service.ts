import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { MemberRecord } from './contracts';
@Injectable({ providedIn: 'root' })
export class MembershipApiService {
  private readonly api = inject(ApiClient);

  list(companyId: string, token: string): Observable<MemberRecord[]> {
    return this.api.request<MemberRecord[]>('GET', `organizations/${companyId}/memberships`, token);
  }

  get(companyId: string, userId: string, token: string): Observable<MemberRecord> {
    return this.api.request<MemberRecord>(
      'GET',
      `organizations/${companyId}/memberships/${userId}`,
      token,
    );
  }

  update(companyId: string, userId: string, fields: unknown, token: string): Observable<MemberRecord> {
    return this.api.request<MemberRecord>(
      'PATCH',
      `organizations/${companyId}/memberships/${userId}`,
      token,
      fields,
    );
  }
}

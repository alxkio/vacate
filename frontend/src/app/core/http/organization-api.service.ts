import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { OrganizationResponse, OrganizationSummary, Roles } from './contracts';
@Injectable({ providedIn: 'root' })
export class OrganizationApiService {
  private readonly api = inject(ApiClient);

  get(id: string, token: string): Observable<OrganizationResponse> {
    return this.api.request<OrganizationResponse>('GET', `organizations/${id}`, token);
  }

  summary(id: string, token: string): Observable<OrganizationSummary> {
    return this.api.request<OrganizationSummary>('GET', `organizations/${id}/summary`, token);
  }

  references(id: string, token: string): Observable<Roles> {
    return this.api.request<Roles>('GET', `organizations/${id}/roles`, token);
  }

  update(id: string, fields: unknown, token: string): Observable<OrganizationResponse> {
    return this.api.request<OrganizationResponse>('PATCH', `organizations/${id}`, token, fields);
  }

  createNode(
    id: string,
    kind: 'departments' | 'teams',
    name: string,
    departmentId: string | null,
    token: string,
  ): Observable<unknown> {
    return this.api.request('POST', `organizations/${id}/${kind}`, token, {
      name,
      ...(kind === 'teams' ? { departmentId } : {}),
    });
  }

  renameNode(
    id: string,
    kind: 'departments' | 'teams',
    nodeId: string,
    name: string,
    token: string,
  ): Observable<unknown> {
    return this.api.request('PATCH', `organizations/${id}/${kind}/${nodeId}`, token, { name });
  }

  updateApproval(
    id: string,
    kind: 'departments' | 'teams',
    nodeId: string,
    required: boolean | null,
    token: string,
  ): Observable<unknown> {
    return this.api.request('PATCH', `organizations/${id}/${kind}/${nodeId}`, token, {
      requireVacationApproval: required,
    });
  }
}

import { inject, Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { OrganizationResponse, OrganizationSummary, Roles } from './contracts';
@Injectable({ providedIn: 'root' })
export class OrganizationApiService {
  private readonly api = inject(ApiClient);

  get(id: string, token: string) {
    return this.api.request<OrganizationResponse>('GET', `organizations/${id}`, token);
  }

  summary(id: string, token: string) {
    return this.api.request<OrganizationSummary>('GET', `organizations/${id}/summary`, token);
  }

  references(id: string, token: string) {
    return this.api.request<Roles>('GET', `organizations/${id}/roles`, token);
  }

  update(id: string, fields: unknown, token: string) {
    return this.api.request<OrganizationResponse>('PATCH', `organizations/${id}`, token, fields);
  }

  renameNode(
    id: string,
    kind: 'departments' | 'teams',
    nodeId: string,
    name: string,
    token: string,
  ) {
    return this.api.request('PATCH', `organizations/${id}/${kind}/${nodeId}`, token, { name });
  }
}

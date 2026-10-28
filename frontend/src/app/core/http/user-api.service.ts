import { inject, Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { OwnProfile } from '../models/workspace.models';
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly api = inject(ApiClient);

  getOwn(id: string, token: string) {
    return this.api.request<OwnProfile>('GET', `users/${id}`, token);
  }

  updateProfile(id: string, fields: unknown, token: string) {
    return this.api.request<OwnProfile>('PATCH', `users/${id}`, token, fields);
  }
}

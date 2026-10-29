import { inject, Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { DirectoryUser } from './contracts';
import { OwnProfile } from '../models/workspace.models';
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly api = inject(ApiClient);

  list(token: string) {
    return this.api.request<DirectoryUser[]>('GET', 'users', token);
  }

  getOwn(id: string, token: string) {
    return this.api.request<OwnProfile>('GET', `users/${id}`, token);
  }

  updateProfile(id: string, fields: unknown, token: string) {
    return this.api.request<OwnProfile>('PATCH', `users/${id}`, token, fields);
  }
}

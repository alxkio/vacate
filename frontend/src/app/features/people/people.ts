import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { DirectoryUser } from '../../core/http/contracts';
import { OrganizationSettings } from '../organizations/organization-settings';

@Component({
  selector: 'vacate-people',
  imports: [OrganizationSettings],
  template: `
    @if (data.currentUser()?.capability === 'admin') {
      <vacate-organization [companyId]="data.currentUser()?.companyId || ''" [membersOnly]="true" />
    } @else {
      <section class="navigation-card">
        <h2>People</h2>
        <p>Your organization’s directory. Your personal requests and balances are in My Leave.</p>
        @if (error) {
          <p role="alert">{{ error }}</p>
        }
        @if (loading) {
          <p role="status">Loading people…</p>
        }
        <button
          type="button"
          class="secondary"
          (click)="loadPeople()"
          [attr.aria-disabled]="loading"
        >
          {{ error ? 'Retry loading people' : 'Refresh people' }}
        </button>
        <ul class="dialog-list">
          @for (person of people; track person.username) {
            <li [attr.data-person]="person.email.split('@')[0]">
              {{ person.firstName }} {{ person.middleName }} {{ person.lastName
              }}<small>{{ person.jobTitle }} · {{ person.email }}</small>
            </li>
          } @empty {
            @if (!loading && !error) {
              <li>No people available.</li>
            }
          }
        </ul>
      </section>
    }
  `,
})
export class People implements OnInit {
  readonly data = inject(WorkspaceDataService);
  readonly detector = inject(ChangeDetectorRef);
  people: DirectoryUser[] = [];
  loading = false;
  error = '';

  async ngOnInit(): Promise<void> {
    if (this.data.currentUser()?.capability === 'admin') {
      return;
    }
    await this.loadPeople();
  }

  async loadPeople(): Promise<void> {
    if (this.loading) {
      return;
    }
    const actor = this.data.currentUser()?.id;
    const generation = this.data.api.sessionGeneration;
    this.loading = true;
    this.error = '';
    try {
      const people = await this.data.api.directory();
      if (this.data.currentUser()?.id === actor && this.data.api.sessionGeneration === generation) {
        this.people = people;
      }
    } catch {
      if (this.data.currentUser()?.id === actor && this.data.api.sessionGeneration === generation) {
        this.error = 'People could not be loaded. Try again.';
      }
    } finally {
      this.loading = false;
      this.detector.markForCheck();
    }
  }
}

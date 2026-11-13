import { PersonnelOverview } from '../administration/personnel';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { apiId } from '../../core/state/workspace-api.service';
import { DirectoryUser } from '../../core/http/contracts';
import { OrganizationSettings } from '../organizations/organization-settings';

@Component({
  selector: 'vacate-people',
  imports: [OrganizationSettings, PersonnelOverview],
  template: `
    @if (isAdmin) {
      <nav class="people-views" aria-label="People views">
        <button
          class="secondary"
          type="button"
          [attr.aria-pressed]="!overview"
          (click)="overview = false"
        >
          Company directory
        </button>
        <button
          class="secondary"
          type="button"
          [attr.aria-pressed]="overview"
          (click)="overview = true"
        >
          Personnel leave overview
        </button>
      </nav>
    }
    @if (isAdmin && overview) {
      <vacate-personnel />
    } @else {
      <section class="navigation-card" aria-labelledby="people-heading">
        <h2 id="people-heading">Company directory</h2>
        <p>
          All colleagues in your company. Department and team labels explain how you work together.
        </p>
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
        <p class="people-legend">
          Relationships: <span class="colleague-tag same-team">Your team</span>
          <span class="colleague-tag same-department">Your department</span>
          <span class="colleague-tag company-colleague">Other colleagues</span>
        </p>
        <p class="people-scroll-hint">
          Scroll the table horizontally to see departments, teams and relationships.
        </p>
        <div class="people-table" role="region" tabindex="0" aria-label="Company colleagues">
          <table>
            <caption>
              {{
                people.length
              }}
              company members
            </caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Department</th>
                <th scope="col">Team</th>
                <th scope="col">Relationship</th>
                @if (isAdmin) {
                  <th scope="col">Membership</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (person of people; track person.guid || person.username) {
                <tr [attr.data-person]="person.email.split('@')[0]">
                  <th scope="row">
                    {{ person.firstName }} {{ person.middleName }} {{ person.lastName
                    }}<small>{{ person.email }}</small>
                  </th>
                  <td>{{ person.jobTitle || 'Not assigned' }}</td>
                  <td>{{ person.departmentName || 'No department' }}</td>
                  <td>{{ person.teamName || 'No team' }}</td>
                  <td>
                    <span [class]="'colleague-tag ' + relationship(person)">{{
                      relationshipLabel(person)
                    }}</span>
                  </td>
                  @if (isAdmin) {
                    <td>
                      <button
                        type="button"
                        class="secondary"
                        [attr.data-edit-person]="person.guid"
                        [attr.data-edit-membership]="person.email.split('@')[0]"
                        (click)="editing = person.guid || ''"
                      >
                        Edit membership
                      </button>
                    </td>
                  }
                </tr>
              } @empty {
                @if (!loading && !error) {
                  <tr>
                    <td [attr.colspan]="isAdmin ? 6 : 5">No people available.</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </section>
      @if (isAdmin && editing) {
        <vacate-organization
          [companyId]="data.currentUser()?.companyId || ''"
          [membersOnly]="true"
          [memberGuid]="editing"
          (memberClosed)="editing = ''"
          (changed)="loadPeople()"
        />
      }
    }
  `,
  styles: `
    .people-views {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }
    .people-scroll-hint {
      margin-top: 16px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.6;
    }
    .people-table {
      overflow-x: auto;
      margin-top: 20px;
    }
    table {
      width: 100%;
      min-width: 780px;
      border-collapse: collapse;
      text-align: left;
    }
    th,
    td {
      padding: 16px 12px;
      border-bottom: 1px solid var(--line);
      vertical-align: middle;
    }
    th small {
      display: block;
      margin-top: 6px;
      color: var(--muted);
      font-weight: 400;
    }
    caption {
      text-align: left;
      padding: 12px;
      color: var(--muted);
    }
    .people-legend {
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
  `,
})
export class People implements OnInit {
  readonly data = inject(WorkspaceDataService);
  readonly detector = inject(ChangeDetectorRef);
  people: DirectoryUser[] = [];
  loading = false;
  error = '';
  editing = '';
  overview = false;

  get isAdmin(): boolean {
    return this.data.currentUser()?.capability === 'admin';
  }

  relationship(person: DirectoryUser): string {
    const actor = this.data.currentUser();
    if (actor?.teamId && person.teamId === apiId(actor.teamId)) return 'same-team';
    if (actor?.departmentId && person.departmentId === apiId(actor.departmentId))
      return 'same-department';
    return 'company-colleague';
  }

  relationshipLabel(person: DirectoryUser): string {
    return (
      {
        'same-team': 'Your team',
        'same-department': 'Your department',
        'company-colleague': 'Other colleague',
      } as Record<string, string>
    )[this.relationship(person)];
  }

  async ngOnInit(): Promise<void> {
    await this.loadPeople();
  }

  async loadPeople(): Promise<void> {
    if (this.loading) return;
    const actor = this.data.currentUser()?.id;
    const generation = this.data.api.sessionGeneration;
    this.loading = true;
    this.error = '';
    try {
      if (this.isAdmin) {
        await this.data.api.refresh();
      }
      const people = await this.data.api.directory();
      if (this.data.currentUser()?.id === actor && this.data.api.sessionGeneration === generation)
        this.people = people;
    } catch {
      if (this.data.currentUser()?.id === actor && this.data.api.sessionGeneration === generation)
        this.error = 'People could not be loaded. Try again.';
    } finally {
      this.loading = false;
      this.detector.markForCheck();
    }
  }
}

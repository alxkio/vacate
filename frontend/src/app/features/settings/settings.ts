import { Component, inject, Input, output } from '@angular/core';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { DisplayPreferences } from '../../core/models/workspace.models';
import { ProfileSettings } from '../profile/profile-settings';
import { OrganizationSettings } from '../organizations/organization-settings';

@Component({
  selector: 'vacate-unified-settings',
  imports: [ProfileSettings, OrganizationSettings],
  template: `
    <div class="unified-settings">
      <nav class="settings-navigation" aria-label="Settings sections">
        @for (section of sections; track section.id) {
          <button
            [attr.data-settings-section]="section.id"
            class="nav-item"
            [class.selected]="selected === section.id"
            [attr.aria-current]="selected === section.id ? 'page' : null"
            (click)="sectionChanged.emit(section.id)"
          >
            {{ section.name }}
          </button>
        }
      </nav>
      <div class="settings-content">
        @if (selected === 'team' && companyId !== data.currentUser()?.companyId) {
          <section class="navigation-card">
            <h2>Team unavailable</h2>
            <p>This team is outside your organization.</p>
          </section>
        } @else if (selected === 'organization') {
          <vacate-organization
            [companyId]="companyId"
            (changed)="saved.emit()"
            (staleSession)="staleSession.emit()"
          />
        } @else if (selected === 'team' && companyId === data.currentUser()?.companyId) {
          <section class="navigation-card">
            <h2>My team</h2>
            <p>
              {{ data.groupName('team', data.currentUser()?.teamId || '') || 'No team assigned' }}
            </p>
            <p>
              Your assigned team includes you. A job title or manager assignment does not grant team
              administration or approval rights.
            </p>
            <ul class="dialog-list">
              @for (person of data.myTeamPeople; track person.id) {
                <li>
                  {{ person.name }}{{ person.email === data.currentUser()?.email ? ' (you)' : ''
                  }}<small>{{ person.title }}</small>
                </li>
              } @empty {
                <li>No team membership assigned.</li>
              }
            </ul>
            @if (data.currentUser()?.capability === 'admin') {
              <button class="inline-link" (click)="sectionChanged.emit('organization')">
                Manage organization teams →
              </button>
            }
          </section>
        } @else {
          <vacate-settings
            (saved)="saved.emit()"
            (displayPreferencesSaved)="displayPreferencesSaved.emit($event)"
            (staleSession)="staleSession.emit()"
          />
        }
      </div>
    </div>
  `,
})
export class UnifiedSettings {
  readonly data = inject(WorkspaceDataService);
  @Input() companyId = '';
  @Input() selected = 'profile';
  readonly sections = [
    { id: 'organization', name: 'Organization' },
    { id: 'team', name: 'Team' },
    { id: 'profile', name: 'Profile' },
  ];
  readonly sectionChanged = output<string>();
  readonly saved = output<void>();
  readonly staleSession = output<void>();
  readonly displayPreferencesSaved = output<DisplayPreferences>();
}

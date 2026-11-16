import { Component, inject, Input, output } from '@angular/core';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { DisplayPreferences } from '../../core/models/workspace.models';
import { ProfileSettings } from '../profile/profile-settings';
import { OrganizationSettings } from '../organizations/organization-settings';
import { resolveSettingsSection, settingsSections } from './settings-navigation';
import { ScopeSettings } from './scope-settings';

@Component({
  selector: 'vacate-unified-settings',
  imports: [ProfileSettings, OrganizationSettings, ScopeSettings],
  template: `
    <div class="unified-settings">
      <nav class="settings-navigation" aria-label="Settings sections">
        @for (section of sections; track section.id) {
          <button
            class="nav-item"
            [attr.data-settings-section]="section.id"
            [class.selected]="activeSection === section.id"
            [attr.aria-current]="activeSection === section.id ? 'page' : null"
            (click)="sectionChanged.emit(section.id)"
          >
            {{ section.name }}
          </button>
        }
      </nav>
      <div class="settings-content">
        @if (
          (activeSection === 'team' || activeSection === 'department') &&
          companyId !== data.currentUser()?.companyId
        ) {
          <section class="navigation-card">
            <h2>Team unavailable</h2>
            <p>This team is outside your organization.</p>
          </section>
        } @else if (activeSection === 'organization') {
          <vacate-organization
            [companyId]="companyId"
            (changed)="saved.emit()"
            (staleSession)="staleSession.emit()"
          />
        } @else if (activeSection === 'team' || activeSection === 'department') {
          <vacate-scope-settings
            [companyId]="companyId"
            [kind]="activeSection === 'team' ? 'teams' : 'departments'"
            [nodeGuid]="nodeGuid"
            (nodeChanged)="nodeChanged.emit($event)"
          />
        } @else {
          <vacate-settings
            [section]="activeSection === 'system' ? 'system' : 'profile'"
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
  @Input() nodeGuid = '';
  readonly nodeChanged = output<string>();
  get sections(): (
    | { readonly id: 'organization'; readonly name: 'Organization'; readonly admin: true }
    | { readonly id: 'department'; readonly name: 'Departments'; readonly admin: true }
    | { readonly id: 'team'; readonly name: 'Teams'; readonly admin: true }
    | { readonly id: 'profile'; readonly name: 'Profile'; readonly admin: false }
    | { readonly id: 'system'; readonly name: 'System'; readonly admin: false }
  )[] {
    return settingsSections(this.data.currentUser(), this.data.api.settingsAccess);
  }

  get activeSection(): 'team' | 'department' | 'organization' | 'profile' | 'system' {
    return resolveSettingsSection(
      this.selected,
      this.data.currentUser(),
      this.data.api.settingsAccess,
    );
  }

  readonly sectionChanged = output<string>();
  readonly saved = output<void>();
  readonly staleSession = output<void>();
  readonly displayPreferencesSaved = output<DisplayPreferences>();
}

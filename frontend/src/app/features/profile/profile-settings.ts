import { ChangeDetectorRef, Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { DisplayPreferences, OwnProfileFields } from '../../core/models/workspace.models';

@Component({
  selector: 'vacate-settings',
  imports: [FormsModule],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.scss',
})
export class ProfileSettings {
  readonly data = inject(WorkspaceDataService);
  readonly detector = inject(ChangeDetectorRef);
  readonly saved = output<void>();
  readonly displayPreferencesSaved = output<DisplayPreferences>();
  readonly staleSession = output<void>();
  readonly account = this.data.currentUser();
  readonly accountId = this.account?.id || '';
  readonly companyId = this.account?.companyId || '';
  profile = this.data.profiles.read();
  draft = this.fields();
  displayPreferences = this.data.displayPreferences(this.account);
  message = '';
  error = '';
  displayPreferencesMessage = '';
  displayPreferencesError = '';
  busy = false;
  get person() {
    return this.data.currentUser();
  }
  get department() {
    return (
      this.data.groupName('department', this.person?.departmentId || '') ||
      this.data.fixtures.departments.find((item) => item.id === this.person?.departmentId)?.name
    );
  }
  get systemRole() {
    return this.person?.capability === 'admin' ? 'Admin' : 'Employee';
  }

  private fields(): OwnProfileFields {
    const p = this.profile;
    return {
      firstName: p?.firstName || '',
      middleName: p?.middleName || '',
      lastName: p?.lastName || '',
      gender: p?.gender || 'unspecified',
      married: p?.married || false,
      dependentChildren: p?.dependentChildren || 0,
      soleCare: p?.soleCare || false,
    };
  }

  reset() {
    if (this.data.currentUser()?.id !== this.accountId) {
      this.staleSession.emit();
      return;
    }
    this.profile = this.data.profiles.read();
    this.draft = this.fields();
    this.error = '';
    this.message = 'Unsaved changes discarded.';
  }

  async submit() {
    if (this.busy) return;
    this.message = '';
    if (this.data.currentUser()?.id !== this.accountId) {
      this.error = 'Your account changed. Reopen settings before saving.';
      this.staleSession.emit();
      return;
    }
    this.busy = true;
    const result = await this.data.profiles.update(this.accountId, this.draft);
    this.busy = false;
    this.detector.markForCheck();
    this.error = result.error || '';
    if (result.ok) {
      this.profile = this.data.profiles.read();
      this.draft = this.fields();
      this.message = 'Profile saved by the demo API.';
      this.saved.emit();
    }
  }

  saveDisplayPreferences() {
    this.displayPreferencesMessage = '';
    this.displayPreferencesError = '';
    const current = this.data.currentUser();
    if (
      !this.accountId ||
      !this.companyId ||
      current?.id !== this.accountId ||
      current.companyId !== this.companyId
    ) {
      this.displayPreferencesError = 'Your account changed. Reopen settings before saving.';
      this.staleSession.emit();
      return;
    }
    const result = this.data.saveDisplayPreferences(
      { id: this.accountId, companyId: this.companyId },
      this.displayPreferences,
    );
    if (!result.ok) {
      this.displayPreferencesError = result.error || 'Display preferences could not be saved.';
      return;
    }
    this.displayPreferencesMessage = 'Display preferences saved in this browser for your account.';
    this.displayPreferencesSaved.emit({ ...this.displayPreferences });
  }
}

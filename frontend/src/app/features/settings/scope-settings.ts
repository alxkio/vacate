import { ChangeDetectorRef, Component, inject, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { ApiDepartment } from '../../core/http/contracts';

@Component({
  selector: 'vacate-scope-settings',
  imports: [FormsModule],
  styleUrl: '../profile/profile-settings.scss',
  template: `
    <section class="settings-card navigation-card">
      <h2>{{ kind === 'teams' ? 'Team settings' : 'Department settings' }}</h2>
      @if (nodes.length && companyId === data.currentUser()?.companyId) {
        <form id="scope-settings-form" (ngSubmit)="save()">
          <div class="settings-fields">
            <label
              >{{ kind === 'teams' ? 'Team' : 'Department' }}
              <select
                id="settings-node"
                name="node"
                [(ngModel)]="selectedId"
                (ngModelChange)="reset()"
              >
                @for (node of nodes; track node.guid) {
                  <option [value]="node.guid">{{ node.name }}</option>
                }
              </select>
            </label>
            <label
              >Use inherited approval setting<input
                type="checkbox"
                role="switch"
                class="settings-switch"
                name="inheritApproval"
                [ngModel]="required === null"
                (ngModelChange)="required = $event ? null : true"
            /></label>
            @if (required !== null) {
              <label
                >Require vacation approval<input
                  type="checkbox"
                  role="switch"
                  class="settings-switch"
                  id="scope-vacation-approval"
                  name="approval"
                  [(ngModel)]="required"
              /></label>
            }
          </div>
          <p class="settings-hint">
            Team settings override department settings, then the organization default.
          </p>
          <div class="settings-footer">
            <button class="primary" [disabled]="busy">
              {{ busy ? 'Saving…' : 'Save approval setting' }}
            </button>
          </div>
          <p id="scope-settings-status" role="status" class="settings-success">{{ message }}</p>
          @if (error) {
            <p role="alert" class="settings-error">{{ error }}</p>
          }
        </form>
        @if (kind === 'teams' && selectedId === ownTeam) {
          <h3>My team</h3>
          <ul class="dialog-list">
            @for (person of data.myTeamPeople; track person.id) {
              <li>
                {{ person.name }}{{ person.email === data.currentUser()?.email ? ' (you)' : ''
                }}<small>{{ person.title }}</small>
              </li>
            }
          </ul>
        }
      } @else {
        <p>Settings unavailable for this organization or scope.</p>
      }
    </section>
  `,
})
export class ScopeSettings implements OnChanges {
  readonly data = inject(WorkspaceDataService);
  private readonly detector = inject(ChangeDetectorRef);
  private readonly actorId = this.data.currentUser()?.id || '';
  @Input() companyId = '';
  @Input() kind: 'departments' | 'teams' = 'teams';
  selectedId = '';
  required: boolean | null = null;
  message = '';
  error = '';
  busy = false;

  get nodes(): ApiDepartment[] {
    return this.data.api.settingsAccess?.[this.kind] || [];
  }

  get ownTeam(): string {
    return this.data.currentUser()?.teamId || '';
  }

  ngOnChanges(): void {
    const own = this.kind === 'teams' ? this.ownTeam : this.data.currentUser()?.departmentId || '';
    this.selectedId = this.nodes.find((n) => n.guid === own)?.guid || this.nodes[0]?.guid || '';
    this.reset();
  }

  reset(): void {
    this.required =
      this.nodes.find((n) => n.guid === this.selectedId)?.requireVacationApproval ?? null;
    this.message = '';
    this.error = '';
  }

  async save(): Promise<void> {
    if (this.busy) {
      return;
    }
    if (
      this.companyId !== this.data.currentUser()?.companyId ||
      !this.nodes.some((n) => n.guid === this.selectedId)
    ) {
      this.error = 'Settings unavailable.';
      return;
    }
    this.busy = true;
    const result = await this.data.api.updateApproval(
      this.actorId,
      this.kind,
      this.selectedId,
      this.required,
    );
    this.busy = false;
    this.error = result.error || '';
    this.message = result.ok ? 'Approval requirement saved.' : '';
    this.detector.markForCheck();
  }
}

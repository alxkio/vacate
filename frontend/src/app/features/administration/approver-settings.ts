import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi, AdminCalendar, adminError, Approver } from './admin-api';
import { apiId } from '../../core/state/workspace-api.service';

@Component({
  selector: 'vacate-approver-settings',
  imports: [FormsModule],
  styleUrl: './admin.scss',
  template: ` <section class="admin-section" aria-labelledby="approver-settings-heading">
    <h2 id="approver-settings-heading">Assigned approvers</h2>
    <p class="admin-hint">
      An administrator configures the approver for the organization and optional department/team
      overrides. Requests use team, then department, then organization. An inherited setting uses
      the next configured level.
    </p>
    @if (loading) {
      <p role="status">Loading approver assignments…</p>
    }
    @if (error) {
      <p class="admin-error" role="alert">{{ error }}</p>
      <button type="button" class="secondary" (click)="load()" [disabled]="loading">
        Retry assignments
      </button>
    }
    @if (record) {
      <form class="admin-form" (ngSubmit)="save()">
        <div class="admin-fields">
          <label
            >Assignment scope<select
              name="assignmentScope"
              [(ngModel)]="scopeKey"
              (ngModelChange)="selectScope()"
              [disabled]="busy"
            >
              @for (node of scopes; track node.key) {
                <option [value]="node.key">{{ node.name }}</option>
              }
            </select></label
          ><label
            >Approver<select name="assignedApprover" [(ngModel)]="approverGuid" [disabled]="busy">
              <option [ngValue]="null">
                {{ scopeKey === 'organization' ? 'Not configured' : 'Inherit from next level' }}
              </option>
              @for (candidate of record.candidates; track candidate.guid) {
                <option [value]="candidate.guid">{{ candidate.displayName }}</option>
              }
            </select></label
          >
        </div>
        <p id="effective-approver" role="status">
          <strong>Saved effective approver:</strong> {{ effectiveApprover }}
        </p>
        <p class="admin-hint">
          This explains the saved configuration for the selected scope. Changes above apply after
          saving; the server validates and assigns each request.
        </p>
        <p class="admin-hint">
          Only explicitly assigned company administrators can decide requests. Titles and managers
          do not grant approval authority. A configured approver can decide their own assigned
          request.
        </p>
        <div>
          <button type="submit" class="primary" [disabled]="busy">
            {{ busy ? 'Saving…' : 'Save approver assignment' }}
          </button>
        </div>
      </form>
    }
    <p class="admin-success" role="status">{{ message }}</p>
  </section>`,
})
export class ApproverSettings implements OnInit {
  readonly api = inject(AdminApi);
  readonly detector = inject(ChangeDetectorRef);
  record: AdminCalendar | null = null;
  scopeKey = 'organization';
  approverGuid: string | null = null;
  loading = false;
  busy = false;
  error = '';
  message = '';
  get scopes(): { key: string; name: string; scope: Approver['scope']; guid: string }[] {
    const actor = this.api.data.currentUser();
    const org = this.api.data.organization.read(actor?.companyId || '');
    return [
      {
        key: 'organization',
        name: 'Organization default',
        scope: 'organization' as const,
        guid: apiId(actor?.companyId || ''),
      },
      ...(org?.departments || []).map((node) => ({
        key: `department:${node.id}`,
        name: `Department · ${node.name}`,
        scope: 'department' as const,
        guid: apiId(node.id),
      })),
      ...(org?.teams || []).map((node) => ({
        key: `team:${node.id}`,
        name: `Team · ${node.name}`,
        scope: 'team' as const,
        guid: apiId(node.id),
      })),
    ];
  }

  get effectiveApprover(): string {
    const selected = this.scopes.find((node) => node.key === this.scopeKey);
    if (!selected || !this.record) return 'Scope unavailable. Refresh the settings.';
    const organization = this.scopes.find((node) => node.scope === 'organization')!;
    const chain = [selected];
    if (selected.scope === 'team') {
      const actor = this.api.data.currentUser();
      const org = this.api.data.organization.read(actor?.companyId || '');
      const team = org?.teams.find((team) => apiId(team.id) === selected.guid);
      const department =
        team?.departmentId &&
        this.scopes.find(
          (node) => node.scope === 'department' && node.guid === apiId(team.departmentId!),
        );
      if (department) chain.push(department);
    }
    if (selected.scope !== 'organization') chain.push(organization);
    for (const node of chain) {
      const assignment = this.record.approvers.find(
        (item) => item.scope === node.scope && item.scopeGuid === node.guid,
      );
      if (!assignment) continue;
      const candidate = this.record.candidates.find(
        (person) => person.guid === assignment.approverGuid,
      );
      const source =
        node.key === selected.key ? `assigned at ${node.name}` : `inherited from ${node.name}`;
      return candidate
        ? `${candidate.displayName} · ${source}`
        : `Configured administrator unavailable · ${source}. Configure an active company administrator.`;
    }
    return 'Not configured for this scope. Set an approver here or at an inherited level before submitting approval-required leave in this scope.';
  }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  selectScope(): void {
    const node = this.scopes.find((node) => node.key === this.scopeKey);
    this.approverGuid =
      this.record?.approvers.find(
        (item) => item.scope === node?.scope && item.scopeGuid === node.guid,
      )?.approverGuid || null;
    this.message = '';
  }

  async load(): Promise<void> {
    const owner = this.api.owner;
    this.loading = true;
    this.error = '';
    try {
      const record = await this.api.calendar();
      if (owner === this.api.owner) {
        this.record = record;
        this.selectScope();
      }
    } catch (error) {
      if (owner === this.api.owner)
        this.error = adminError(error, 'Approver assignments could not be loaded. Try again.');
    } finally {
      this.loading = false;
      this.detector.markForCheck();
    }
  }

  async save(): Promise<void> {
    const node = this.scopes.find((node) => node.key === this.scopeKey);
    if (!node || this.busy) return;
    const owner = this.api.owner;
    this.busy = true;
    this.error = '';
    this.message = '';
    try {
      const record = await this.api.saveApprover({
        scope: node.scope,
        scopeGuid: node.guid,
        approverGuid: this.approverGuid,
      });
      if (owner === this.api.owner) {
        this.record = record;
        this.message =
          'Approver assignment saved. All pending requests now use the updated routing; previously decided history is unchanged.';
      }
    } catch (error) {
      if (owner === this.api.owner)
        this.error = adminError(error, 'The assignment was not saved. Try again.');
    } finally {
      this.busy = false;
      this.detector.markForCheck();
    }
  }
}

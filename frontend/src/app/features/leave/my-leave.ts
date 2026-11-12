import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { BalanceBar } from './balance-bar';
import { SavedRequest } from './data-access/leave-requests';
import {
  REFERENCE_TODAY,
  shortDate,
  WorkspaceDataService,
} from '../../core/state/workspace-data.service';
import { Entry, LeaveType } from '../../core/models/workspace.models';

@Component({
  selector: 'vacate-my-leave',
  imports: [BalanceBar],
  template: `
    <section class="navigation-card" aria-labelledby="my-leave-requests">
      <h2 id="my-leave-requests">My requests</h2>
      <h3>Saved requests</h3>
      @if (savedLoading) {
        <p role="status">Loading saved requests…</p>
      }
      @if (savedError) {
        <p role="alert">{{ savedError }}</p>
      }
      <button
        class="secondary"
        type="button"
        [attr.aria-disabled]="savedLoading"
        (click)="!savedLoading && retry.emit()"
      >
        {{ savedError ? 'Retry saved requests' : 'Refresh saved requests' }}
      </button>
      <ul class="dialog-list" id="saved-leave-requests">
        @for (request of savedRequests; track request.guid) {
          <li [attr.data-saved-request]="request.guid">
            <strong>{{ data.typeName(request.leaveTypeId) }}</strong>
            @for (day of request.dates; track day.date) {
              <small
                >{{ day.date }} · {{ day.status === 'Pending' ? 'Pending approval' : day.status }} ·
                Entitlement {{ day.entitlementYear }}</small
              >
            }
          </li>
        } @empty {
          @if (!savedLoading && !savedError) {
            <li>No saved requests. Use Request leave to add one.</li>
          }
        }
      </ul>
    </section>
    <section class="navigation-card" aria-labelledby="my-leave-balances">
      <h2 id="my-leave-balances">My balances · {{ year }}</h2>
      <p>
        Fictional reference balances for types used this year. Event-based leave stays in your
        request history.
      </p>
      <div class="my-leave-balances">
        @for (type of usedTypes; track type.id) {
          <article class="navigation-card" [attr.data-used-balance]="type.id">
            <h3>{{ type.name }}</h3>
            @if (data.balance(type.id); as balance) {
              <p>
                <strong>{{ balance.available }}</strong> {{ type.unit }} remaining
              </p>
              <vacate-balance-bar [balance]="balance" [label]="type.name" [unit]="type.unit" />
              <p>Used {{ balance.used }} · Pending {{ balance.pending }}</p>
              @if (type.id === 'annual' && approvalRequired) {
                <p>Pending approval is not deducted.</p>
              }
            } @else {
              <p>Balance to confirm.</p>
            }
          </article>
        } @empty {
          <p>No recurring leave types used in {{ year }}.</p>
        }
      </div>
      <button class="inline-link" data-nav="balances">View my balances →</button>
    </section>
    <section class="navigation-card" aria-labelledby="reference-history">
      <h2 id="reference-history">Fictional reference history</h2>
      <p>
        The reference examples below are separate from saved requests and are not submitted or
        charged.
      </p>
      <ul class="dialog-list">
        @for (entry of entries; track entry.id) {
          <li [attr.data-request-start]="entry.start" [attr.data-request-id]="entry.id">
            <strong>{{ entry.title }}</strong>
            <small
              >{{ shortDate(entry.start) }} – {{ shortDate(entry.end) }} ·
              {{ data.typeName(entry.type) }} ·
              {{
                entry.status === 'Pending' && approvalRequired ? 'Pending approval' : entry.status
              }}</small
            >
          </li>
        } @empty {
          <li>No requests.</li>
        }
      </ul>
    </section>
  `,
  styles: `
    .my-leave-balances {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      gap: 16px;
      margin: 20px 0;
    }
  `,
})
export class MyLeave {
  @Input() savedRequests: SavedRequest[] = [];
  @Input() savedError = '';
  @Input() savedLoading = false;
  @Output() retry = new EventEmitter<void>();
  readonly data = inject(WorkspaceDataService);
  readonly year = REFERENCE_TODAY.getFullYear();
  readonly shortDate = shortDate;

  get approvalRequired(): boolean {
    return this.data.api.settingsAccess?.effectiveVacationApproval === true;
  }

  get entries(): Entry[] {
    return [...this.data.fixtures.ownEntries(this.data.currentUser()!)].sort(
      (a, b) =>
        b.start.localeCompare(a.start) || b.end.localeCompare(a.end) || a.id.localeCompare(b.id),
    );
  }

  get usedTypes(): LeaveType[] {
    const ids = new Set(
      this.entries
        .filter(
          (entry) =>
            entry.status === 'Approved' &&
            entry.start.slice(0, 4) <= String(this.year) &&
            entry.end.slice(0, 4) >= String(this.year),
        )
        .map((entry) => entry.type),
    );
    return this.data.catalogue.types.filter((type) => ids.has(type.id) && type.shape === 'fixed');
  }
}

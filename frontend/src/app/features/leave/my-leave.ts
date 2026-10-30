import { Component, inject } from '@angular/core';
import { BalanceBar } from './allowance';
import {
  REFERENCE_TODAY,
  shortDate,
  WorkspaceDataService,
} from '../../core/state/workspace-data.service';

@Component({
  selector: 'vacate-my-leave',
  imports: [BalanceBar],
  template: `
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
    <section class="navigation-card" aria-labelledby="my-leave-requests">
      <h2 id="my-leave-requests">My requests</h2>
      <p>Your fictional request history. Requests are not saved or sent.</p>
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
  readonly data = inject(WorkspaceDataService);
  readonly year = REFERENCE_TODAY.getFullYear();
  readonly shortDate = shortDate;

  get approvalRequired() {
    return this.data.api.settingsAccess?.effectiveVacationApproval === true;
  }

  get entries() {
    return [...this.data.fixtures.ownEntries(this.data.currentUser()!)].sort(
      (a, b) =>
        b.start.localeCompare(a.start) || b.end.localeCompare(a.end) || a.id.localeCompare(b.id),
    );
  }

  get usedTypes() {
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

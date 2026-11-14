import { DataTable } from '../../shared/data-table/data-table';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BalanceBar } from './balance-bar';
import { Balances } from './balances';
import { CancelRequest } from './cancel-request';
import { SavedRequest } from './data-access/leave-requests';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';

@Component({
  selector: 'vacate-my-leave',
  imports: [DataTable, FormsModule, BalanceBar, Balances, CancelRequest],
  template: `
    <details
      #balanceSummary
      class="navigation-card personal-balances"
      (toggle)="balancesExpanded = balanceSummary.open"
    >
      <summary>
        <span>My balances · {{ year }}</span>
        @if (data.balance('annual'); as balance) {
          <strong>{{ balance.available }} / {{ balance.allocation }} annual days available</strong>
          <vacate-balance-bar [balance]="balance" />
          <small>Used {{ balance.used }} · Pending {{ balance.pending }}</small>
          <small>{{ balance.note }}</small>
        } @else {
          <span>Annual balance to confirm</span>
        }
        <span class="inline-link">{{
          balancesExpanded ? 'Hide balance details' : 'Show balance details and leave types'
        }}</span>
      </summary>
      <vacate-balances [viewState]="balanceViewState" (example)="example.emit($event)" />
    </details>
    <section class="navigation-card" aria-labelledby="my-leave-requests">
      <div class="action-row">
        <h2 #historyHeading tabindex="-1" id="my-leave-requests">Leave and requests</h2>
        <button
          class="secondary"
          type="button"
          [attr.aria-disabled]="savedLoading"
          (click)="!savedLoading && retry.emit()"
        >
          {{ savedError ? 'Retry saved requests' : 'Refresh saved requests' }}
        </button>
      </div>
      <div class="history-filters">
        <label
          >Status<select [(ngModel)]="status">
            <option value="">All statuses</option>
            @for (value of statuses; track value) {
              <option [value]="value">{{ value }}</option>
            }
          </select></label
        >
        <label
          >Leave type<select [(ngModel)]="type">
            <option value="">All types</option>
            @for (value of types; track value) {
              <option [value]="value">{{ data.typeName(value) }}</option>
            }
          </select></label
        >
        <label
          >From<input
            type="date"
            [attr.aria-invalid]="from && to && from > to ? true : null"
            [attr.aria-describedby]="from && to && from > to ? 'history-period-error' : null"
            [(ngModel)]="from"
        /></label>
        <label
          >To<input
            type="date"
            [attr.aria-invalid]="from && to && from > to ? true : null"
            [attr.aria-describedby]="from && to && from > to ? 'history-period-error' : null"
            [(ngModel)]="to"
        /></label>
        <button class="secondary" type="button" (click)="reset()">Clear filters</button>
      </div>
      @if (from && to && from > to) {
        <p id="history-period-error" role="alert">From must be before To.</p>
      }
      @if (savedLoading) {
        <p role="status">Loading saved requests…</p>
      }
      @if (savedError) {
        <p role="alert">{{ savedError }}</p>
      }
      <p id="saved-history-hint" class="history-hint">
        Expired dates never deduct; pending approval is counted separately. Scroll the table
        horizontally for all columns.
      </p>
      <vacate-data-table
        class="history-table"
        label="Leave and request history"
        describedBy="saved-history-hint"
      >
        <table id="saved-leave-requests">
          <caption>
            @if (savedLoading) {
              Loading saved requests…
            } @else if (savedError) {
              Saved leave and request dates
            } @else {
              All years · {{ rows.length }} recorded {{ rows.length === 1 ? 'date' : 'dates' }}
            }
          </caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Leave type</th>
              <th scope="col">Status</th>
              <th scope="col">Entitlement year</th>
              <th scope="col" class="table-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows; track row.request.guid + row.day.date) {
              <tr [attr.data-saved-request]="row.request.guid">
                <th scope="row">{{ row.day.date }}</th>
                <td>
                  {{ data.typeName(row.request.leaveTypeId) }}
                  @if (row.request.closureGuid) {
                    <small>Automatically recorded company closure</small>
                  }
                </td>
                <td>
                  <span class="table-status" [attr.data-status]="row.day.status">{{
                    row.day.status === 'Pending' ? 'Pending approval' : row.day.status
                  }}</span>
                </td>
                <td>
                  {{
                    row.request.leaveTypeId === 'company-closure'
                      ? 'No balance impact'
                      : row.day.entitlementYear
                  }}
                </td>
                <td class="table-actions">
                  @if (row.day.canCancel) {
                    <button class="secondary" type="button" (click)="manage(row.request.guid)">
                      Cancel / modify<span class="sr-only"> {{ row.day.date }}</span>
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              @if (!savedLoading && !savedError) {
                <tr>
                  <td colspan="5">
                    {{
                      savedRequests.length
                        ? 'No dates match these filters.'
                        : 'No saved requests. Use Request leave to add one.'
                    }}
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </vacate-data-table>
      @for (request of savedRequests; track request.guid) {
        @if (editing === request.guid) {
          <section class="request-editor">
            <h3 #editorHeading tabindex="-1">
              Manage {{ data.typeName(request.leaveTypeId) }} request
            </h3>
            <vacate-cancel-request [request]="request" (changed)="closeEditor()" /><button
              class="secondary"
              type="button"
              (click)="closeEditor()"
            >
              Close request
            </button>
          </section>
        }
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
    }
    .navigation-card {
      min-width: 0;
      max-width: 100%;
    }
    .personal-balances {
      position: relative;
    }
    summary {
      list-style: none;
    }
    summary::-webkit-details-marker {
      display: none;
    }
    summary::after {
      content: '';
      position: absolute;
      top: 28px;
      right: 28px;
      width: 8px;
      height: 8px;
      border-right: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: rotate(45deg);
    }
    details[open] > summary::after {
      transform: rotate(225deg);
    }
    summary {
      cursor: pointer;
    }
    summary > * {
      display: block;
      margin: 8px 0;
    }
    summary strong {
      font-size: 22px;
    }
    .personal-balances {
      margin-bottom: 24px;
    }
    .history-filters {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: 12px;
      margin: 20px 0;
    }
    label {
      display: grid;
      gap: 6px;
    }
    input,
    select {
      min-height: 44px;
      max-width: 100%;
      padding: 8px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: white;
    }
    .history-hint {
      margin: 16px 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.6;
    }
    .request-editor {
      margin-top: 24px;
    }
  `,
})
export class MyLeave {
  @Input() savedRequests: SavedRequest[] = [];
  @Input() savedError = '';
  @Input() balanceViewState = { showAll: false, expanded: new Set<string>() };
  @Input() savedLoading = false;
  @Output() retry = new EventEmitter<void>();
  @Output() example = new EventEmitter<{ type: string; trigger: HTMLElement }>();
  readonly data = inject(WorkspaceDataService);
  readonly detector = inject(ChangeDetectorRef);
  @ViewChild('historyHeading') historyHeading?: ElementRef<HTMLElement>;
  @ViewChild('editorHeading') editorHeading?: ElementRef<HTMLElement>;
  get year(): string | number {
    return (
      this.data.profiles.read()?.membership?.balance.periodStart.slice(0, 4) ||
      new Date().getFullYear()
    );
  }
  readonly statuses = ['Approved', 'Pending', 'Declined', 'Cancelled', 'Expired'];
  balancesExpanded = false;
  status = '';
  type = '';
  from = '';
  to = '';
  editing = '';

  get types(): string[] {
    return [...new Set(this.savedRequests.map((request) => request.leaveTypeId))];
  }

  get rows() {
    return this.savedRequests
      .flatMap((request) => request.dates.map((day) => ({ request, day })))
      .filter(
        ({ request, day }) =>
          (!this.status || day.status === this.status) &&
          (!this.type || request.leaveTypeId === this.type) &&
          (!this.from || day.date >= this.from) &&
          (!this.to || day.date <= this.to),
      )
      .sort(
        (a, b) =>
          b.day.date.localeCompare(a.day.date) || a.request.guid.localeCompare(b.request.guid),
      );
  }

  manage(guid: string): void {
    this.editing = guid;
    this.detector.detectChanges();
    this.editorHeading?.nativeElement.focus();
  }

  closeEditor(): void {
    this.editing = '';
    this.detector.detectChanges();
    this.historyHeading?.nativeElement.focus();
  }

  reset(): void {
    this.status = this.type = this.from = this.to = '';
  }
}

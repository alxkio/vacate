import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { LeaveRequests, SavedRequest } from './data-access/leave-requests';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';

@Component({
  selector: 'vacate-cancel-request',
  template: `
    @if (eligible.length) {
      @if (!editing) {
        <button class="secondary" type="button" (click)="begin()">Cancel / modify request</button>
      } @else {
        <fieldset #choices [disabled]="busy">
          <legend>Cancel all eligible dates or select dates to remove</legend>
          <p>
            Past entries stay unchanged. To move leave, cancel the affected dates and submit a new
            request.
          </p>
          @for (day of eligible; track day.date) {
            <label class="cancel-date"
              ><input
                type="checkbox"
                [checked]="selected.has(day.date)"
                (change)="toggle(day.date)"
              />{{ day.date }} · {{ day.status }}</label
            >
          }
          <div class="action-row">
            <button class="secondary" type="button" (click)="all()">
              Select all eligible dates
            </button>
            <button class="primary" type="button" [disabled]="!selected.size" (click)="save()">
              {{ busy ? 'Cancelling…' : 'Confirm cancellation (' + selected.size + ')' }}
            </button>
            <button class="secondary" type="button" (click)="editing = false">Keep request</button>
          </div>
        </fieldset>
      }
    }
    @if (error) {
      <p role="alert">{{ error }}</p>
    }
    <p role="status">{{ message }}</p>
  `,
  styles: `
    .cancel-date {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 10px 0;
    }
    .cancel-date {
      min-height: 44px;
    }
    .cancel-date input[type='checkbox'] {
      flex: 0 0 20px;
      width: 20px;
      height: 20px;
      min-height: 20px;
      margin: 0;
      padding: 0;
      accent-color: var(--accent);
    }
    fieldset {
      margin-top: 16px;
      padding: 16px;
      border: 1px solid var(--line);
    }
  `,
})
export class CancelRequest {
  @Input({ required: true }) request!: SavedRequest;
  @Output() changed = new EventEmitter<void>();
  readonly leave = inject(LeaveRequests);
  readonly data = inject(WorkspaceDataService);
  readonly detector = inject(ChangeDetectorRef);
  @ViewChild('choices') choices?: ElementRef<HTMLFieldSetElement>;
  editing = false;
  busy = false;
  selected = new Set<string>();
  error = '';
  message = '';

  get eligible() {
    return this.request.closureGuid || this.request.source === 'CompanyClosure'
      ? []
      : this.request.dates.filter((day) => day.canCancel === true);
  }

  begin(): void {
    this.all();
    this.error = '';
    this.message = '';
    this.editing = true;
    this.detector.detectChanges();
    this.choices?.nativeElement.querySelector('input')?.focus();
  }

  all(): void {
    this.selected = new Set(this.eligible.map((day) => day.date));
  }

  toggle(date: string): void {
    if (this.selected.has(date)) this.selected.delete(date);
    else this.selected.add(date);
  }

  async save(): Promise<void> {
    if (this.busy || !this.selected.size) return;
    const actor = this.data.currentUser()?.id;
    const generation = this.data.api.sessionGeneration;
    this.busy = true;
    this.error = '';
    let confirmed = false;
    try {
      await this.leave.cancel(this.request.guid, [...this.selected]);
      if (actor !== this.data.currentUser()?.id || generation !== this.data.api.sessionGeneration)
        return;
      confirmed = true;
      this.editing = false;
      this.message = 'Selected dates cancelled.';
      await Promise.all([this.leave.refresh(), this.data.api.refresh()]);
      if (actor === this.data.currentUser()?.id && generation === this.data.api.sessionGeneration)
        this.changed.emit();
    } catch {
      if (actor === this.data.currentUser()?.id && generation === this.data.api.sessionGeneration)
        this.error = confirmed
          ? 'Cancellation saved. Updated balances could not be loaded; refresh before relying on them.'
          : 'Cancellation was not confirmed. Refresh the request and try again.';
    } finally {
      this.busy = false;
      this.detector.markForCheck();
    }
  }
}

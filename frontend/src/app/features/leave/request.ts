import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  OnDestroy,
  Output,
} from '@angular/core';
import { Allowance } from './allowance';
import { FeedbackToast } from '../../shared/feedback-toast/feedback-toast';
import {
  dateFromKey,
  dateKey,
  eligibilityLabel,
  formatAmount,
  shortDate,
  WorkspaceDataService,
} from '../../core/state/workspace-data.service';
import { LeaveDraft, LeavePreview, LeaveRequests } from './data-access/leave-requests';
import { Decision, LeaveType, TypeGroup } from '../../core/models/workspace.models';

@Component({
  selector: 'vacate-request',
  imports: [Allowance, FeedbackToast],
  templateUrl: './request.html',
  styles: `
    #workspace-dialog-title {
      padding-right: 44px;
    }
    .request-type-controls,
    .request-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .request-actions {
      margin-top: 24px;
    }
    .request-type-controls {
      margin: 8px 0;
    }
    .request-type-info {
      min-width: 44px;
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: white;
      color: var(--ink);
      font-weight: 600;
    }
    .request-type-controls .inline-link {
      width: auto;
    }
    @media (max-width: 420px) {
      .request-actions > button {
        width: 100%;
      }
    }
  `,
})
export class Request implements OnInit, OnDestroy {
  readonly requests = inject(LeaveRequests);
  readonly data = inject(WorkspaceDataService);
  readonly changeDetector = inject(ChangeDetectorRef);
  @Input() initialType = 'annual';
  @Input() example = false;
  @Input() page = 'calendar';
  @Output() finished = new EventEmitter<void>();
  @Output() staleSession = new EventEmitter<void>();
  private viewerId = this.data.currentUser()?.id;
  showAll = false;
  typeInfoOpen = false;
  hasDateSelection = false;
  typeId = 'annual';
  start = dateKey(new Date());
  end = this.start;
  amount = '1';
  unit = 'working days';
  rulesOpen = false;
  submitted = false;
  message = '';
  mode: 'duration' | 'range' = 'range';
  preview: LeavePreview | null = null;
  loading = false;
  saving = false;
  savedOutcome = '';
  savedAmount = 0;
  private sequence = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private idempotencyKey = crypto.randomUUID();
  eligibilityLabel = eligibilityLabel;
  formatAmount = formatAmount;
  shortDate = shortDate;
  dateFromKey = dateFromKey;

  ngOnInit(): void {
    this.setType(this.initialType);
    this.rulesOpen = this.example;
  }

  get type(): LeaveType | undefined {
    return this.data.catalogue.getType(this.typeId);
  }
  get decision(): Decision {
    return this.data.decision(this.typeId);
  }
  get shown(): readonly LeaveType[] {
    return this.showAll ? this.data.catalogue.types : this.data.visibleShortlist();
  }
  get pinned(): LeaveType | undefined {
    return !this.showAll &&
      !this.data.catalogue.shortlistIds.includes(this.typeId) &&
      this.decision.status !== 'not-eligible'
      ? this.type
      : undefined;
  }
  get groups(): TypeGroup[] {
    const groups = this.data.catalogue.typeGroups(this.shown);
    if (this.pinned) {
      groups.push({ name: 'Your selected type', types: [this.pinned] });
    }
    return groups;
  }
  get units(): string[] {
    return ['working days', 'hours'];
  }
  get unavailable(): LeaveType[] {
    return this.showAll
      ? this.data.catalogue.types.filter(
          (type) =>
            type.shape !== 'supplement' && this.data.decision(type.id).status === 'not-eligible',
        )
      : [];
  }
  get typeStatus(): string {
    return this.showAll
      ? `All ${this.data.catalogue.types.length} reference types shown; unavailable types and the annual allocation supplement cannot be requested.`
      : `${this.shown.length} shortlisted types shown for your profile.${this.pinned ? ` Your selected type, ${this.data.label(this.pinned)}, is also kept visible.` : ''} Known-unavailable types remain in Show all.`;
  }

  setType(id: string): void {
    this.typeId = id;
    this.message = '';
    this.unit = this.type?.unit || 'working days';
    this.queuePreview();
  }

  optionSuffix(id: string): string {
    const type = this.data.catalogue.getType(id);
    const decision = this.data.decision(id);
    return type?.shape === 'supplement'
      ? ' — annual allocation adjustment'
      : decision.status === 'not-eligible'
        ? ` — Not eligible: ${decision.reason}`
        : decision.status === 'to-confirm'
          ? ' — To confirm'
          : '';
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    this.sequence++;
  }

  get draft(): LeaveDraft {
    return {
      leaveTypeId: this.typeId,
      unit: this.unit === 'hours' ? 'hours' : 'days',
      mode: this.mode,
      startDate: this.start,
      ...(this.mode === 'range' ? { endDate: this.end } : { duration: Number(this.amount) }),
    };
  }

  capture(form: HTMLFormElement, datesChanged = false): void {
    this.hasDateSelection ||= datesChanged;
    const values = new FormData(form);
    this.start = String(values.get('start') || '');
    this.end =
      this.mode === 'range' && this.unit !== 'hours' ? String(values.get('end') || '') : this.end;
    this.amount = this.mode === 'duration' ? String(values.get('amount') || '') : this.amount;
    this.unit = String(values.get('unit') || 'working days');
    this.queuePreview();
  }

  get feedback(): { tone: 'warning' | 'error'; message: string }[] {
    const messages: { tone: 'warning' | 'error'; message: string }[] = [];
    if (this.message) {
      messages.push({ tone: 'error', message: this.message });
    }
    for (const error of this.preview?.errors || []) {
      if (error === 'Select at least one working day.') {
        if (this.hasDateSelection) {
          messages.push({ tone: 'warning', message: 'Choose a date range with working days.' });
        }
      } else {
        messages.push({ tone: 'error', message: error });
      }
    }
    for (const warning of this.preview?.warnings || []) {
      if (warning.startsWith('Public holiday data is unavailable')) continue;
      if (this.hasDateSelection) messages.push({ tone: 'warning', message: warning });
    }
    return messages;
  }

  toggleTypes(form: HTMLFormElement): void {
    this.capture(form);
    this.showAll = !this.showAll;
  }

  switchMode(mode: string): void {
    if (mode === 'duration' && this.mode === 'range' && this.preview?.workingDates.length) {
      this.amount = String(this.preview.workingDates.length);
    }
    this.mode = mode === 'duration' ? 'duration' : 'range';
    this.queuePreview();
  }

  queuePreview(): void {
    clearTimeout(this.timer);
    const sequence = ++this.sequence;
    this.preview = null;
    this.message = '';
    this.idempotencyKey = crypto.randomUUID();
    this.loading = false;
    if (this.unit === 'hours') {
      return;
    }
    if (this.startError || this.endError || this.amountError) {
      this.message = this.startError || this.endError || this.amountError;
      return;
    }
    this.loading = true;
    this.timer = setTimeout(() => void this.loadPreview(sequence), 200);
  }

  private validDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && dateKey(dateFromKey(value)) === value;
  }

  get startError(): string {
    return this.validDate(this.start) ? '' : 'Enter a valid start date.';
  }

  get endError(): string {
    if (this.mode !== 'range' || this.unit === 'hours') return '';
    if (!this.validDate(this.end)) return 'Enter a valid end date.';
    return !this.startError && this.end < this.start
      ? 'End date must be on or after the start date.'
      : '';
  }

  get amountError(): string {
    return this.mode === 'duration' &&
      this.unit !== 'hours' &&
      (!Number.isInteger(+this.amount) || +this.amount <= 0)
      ? 'Enter a positive whole number of working days.'
      : '';
  }

  get pastDateWarning(): string {
    const today = dateKey(new Date());
    return !this.startError && this.start < today
      ? 'This selection includes past dates. Past working days bypass approval; other dates follow your company settings.'
      : '';
  }

  retryPreview(): void {
    if (!this.loading && !this.saving) this.queuePreview();
  }

  private async loadPreview(sequence: number): Promise<void> {
    try {
      const preview = await this.requests.preview(this.draft);
      if (sequence !== this.sequence || this.data.currentUser()?.id !== this.viewerId) {
        return;
      }
      this.preview = preview;
      if (this.mode === 'duration') {
        this.end = preview.endDate;
      }
    } catch (error: any) {
      if (sequence === this.sequence) {
        this.message =
          error.error?.error || error.message || 'The preview could not be calculated. Try again.';
      }
    } finally {
      if (sequence === this.sequence) {
        this.loading = false;
        this.changeDetector.markForCheck();
      }
    }
  }

  get canSubmit(): boolean {
    return (
      !this.loading &&
      !this.saving &&
      !this.startError &&
      !this.endError &&
      !this.amountError &&
      this.unit !== 'hours' &&
      this.type?.shape !== 'supplement' &&
      this.decision.status !== 'not-eligible' &&
      !!this.preview?.canSubmit
    );
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.viewerId || this.data.currentUser()?.id !== this.viewerId) {
      this.staleSession.emit();
      return;
    }
    if (!this.canSubmit) {
      return;
    }
    this.saving = true;
    this.message = '';
    const sequence = this.sequence;
    try {
      const result = await this.requests.submit(
        this.draft,
        this.idempotencyKey,
        this.preview?.fingerprint,
      );
      if (sequence !== this.sequence || this.data.currentUser()?.id !== this.viewerId) {
        return;
      }
      this.preview = result.preview;
      this.savedOutcome = result.outcome;
      this.savedAmount = result.request?.dates.length || 0;
      this.submitted = true;
      await this.requests.refresh();
      this.changeDetector.detectChanges();
      document.querySelector<HTMLButtonElement>('#finish-demo')?.focus();
    } catch (error: any) {
      if (error.status === 409) {
        this.queuePreview();
      }
      this.message =
        error.error?.error ||
        error.message ||
        'The request could not be saved. Your draft is preserved; try again.';
      // Keep the key for an identical retry after a network failure.
    } finally {
      this.saving = false;
      this.changeDetector.markForCheck();
    }
  }
}

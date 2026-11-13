import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminApi,
  AdminCalendar,
  adminError,
  Closure,
  ClosureDraft,
  ClosureResult,
} from './admin-api';

@Component({
  selector: 'vacate-company-calendar',
  imports: [FormsModule],
  templateUrl: './company-calendar.html',
  styleUrl: './admin.scss',
})
export class CompanyCalendar implements OnInit {
  readonly api = inject(AdminApi);
  readonly detector = inject(ChangeDetectorRef);
  @ViewChild('reportHeading') reportHeading?: ElementRef<HTMLElement>;
  @ViewChild('editor') editor?: ElementRef<HTMLDialogElement>;
  record: AdminCalendar | null = null;
  loading = false;
  busy = false;
  error = '';
  formError = '';
  message = '';
  kind: 'holiday' | 'closure' = 'holiday';
  name = '';
  month = 1;
  day = 1;
  startDate = '';
  endDate = '';
  deductAnnualLeave = false;
  preview: ClosureResult[] | null = null;
  report: ClosureResult[] | null = null;
  reportName = '';
  reportDates = '';
  private trigger: HTMLElement | null = null;
  private idempotencyKey = '';

  showReport(closure: Closure): void {
    this.report = closure.results;
    this.reportName = closure.name;
    this.reportDates = `${closure.startDate} – ${closure.endDate}`;
    this.detector.detectChanges();
    this.reportHeading?.nativeElement.focus();
  }

  resultCount(results: ClosureResult[], outcome: ClosureResult['outcome']): number {
    return results.filter((result) => result.outcome === outcome).length;
  }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    if (this.loading) return;
    const owner = this.api.owner;
    this.loading = true;
    this.error = '';
    try {
      const record = await this.api.calendar();
      if (owner === this.api.owner) this.record = record;
    } catch (error) {
      if (owner === this.api.owner)
        this.error = adminError(error, 'Company calendar could not be loaded. Try again.');
    } finally {
      this.loading = false;
      this.detector.markForCheck();
    }
  }

  open(kind: 'holiday' | 'closure', trigger: EventTarget | null): void {
    this.kind = kind;
    this.trigger = trigger instanceof HTMLElement ? trigger : null;
    this.name = '';
    this.startDate = '';
    this.endDate = '';
    this.month = 1;
    this.day = 1;
    this.deductAnnualLeave = false;
    this.formError = '';
    this.preview = null;
    this.idempotencyKey = crypto.randomUUID();
    this.editor?.nativeElement.showModal();
  }

  close(event?: Event): void {
    if (this.busy) {
      event?.preventDefault();
      return;
    }
    this.editor?.nativeElement.close();
    this.trigger?.focus();
  }

  invalidatePreview(): void {
    this.preview = null;
    this.idempotencyKey = crypto.randomUUID();
  }

  get holidayMonthError(): string {
    return Number.isInteger(this.month) && this.month >= 1 && this.month <= 12
      ? ''
      : 'Enter a month from 1 to 12.';
  }

  get holidayMaxDay(): number {
    return this.holidayMonthError ? 31 : new Date(2000, this.month, 0).getDate();
  }

  get holidayDayError(): string {
    return Number.isInteger(this.day) && this.day >= 1 && this.day <= this.holidayMaxDay
      ? ''
      : `Enter a day from 1 to ${this.holidayMaxDay} for the selected month.`;
  }

  private validDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  get startDateError(): string {
    return this.validDate(this.startDate) ? '' : 'Choose a valid start date.';
  }

  get endDateError(): string {
    if (!this.validDate(this.endDate)) return 'Choose a valid end date.';
    return !this.startDateError && this.endDate < this.startDate
      ? 'The end date must be on or after the start date.'
      : '';
  }

  get draft(): ClosureDraft {
    return {
      name: this.name.trim(),
      startDate: this.startDate,
      endDate: this.endDate,
      deductAnnualLeave: this.deductAnnualLeave,
    };
  }

  async save(): Promise<void> {
    if (this.busy) return;
    if (!this.name.trim()) {
      this.formError = 'Enter a name.';
      return;
    }
    const dateError =
      this.kind === 'holiday'
        ? this.holidayMonthError || this.holidayDayError
        : this.startDateError || this.endDateError;
    if (dateError) {
      this.formError = dateError;
      return;
    }
    const owner = this.api.owner;
    this.busy = true;
    this.formError = '';
    let published: Closure | null = null;
    try {
      if (this.kind === 'holiday') {
        await this.api.addHoliday({ name: this.name.trim(), month: this.month, day: this.day });
        if (owner !== this.api.owner) return;
        this.message =
          'Recurring holiday saved. Future leave calculations use this company holiday.';
      } else if (!this.preview) {
        const result = await this.api.previewClosure(this.draft);
        if (owner === this.api.owner) this.preview = result.results;
        return;
      } else {
        const result = await this.api.addClosure(this.draft, this.idempotencyKey);
        if (owner !== this.api.owner) return;
        published = result;
        this.message =
          'Closure published. Review employee results; skipped employees were not charged.';
      }
      this.busy = false;
      this.close();
      await this.load();
      if (published) this.showReport(published);
    } catch (error) {
      if (owner === this.api.owner)
        this.formError = adminError(
          error,
          'Save was not confirmed. Your entries are kept; review the fields and retry saving.',
        );
    } finally {
      this.busy = false;
      this.detector.markForCheck();
    }
  }
}

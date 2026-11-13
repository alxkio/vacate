import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { AdminApi, adminError, Approval } from './admin-api';

@Component({
  selector: 'vacate-approvals',
  templateUrl: './approvals.html',
  styleUrl: './admin.scss',
})
export class Approvals implements OnInit {
  readonly api = inject(AdminApi);
  readonly detector = inject(ChangeDetectorRef);
  @ViewChild('inboxHeading') inboxHeading?: ElementRef<HTMLElement>;
  @ViewChild('reviewHeading') reviewHeading?: ElementRef<HTMLElement>;
  records: Approval[] = [];
  selected: Approval | null = null;
  loading = false;
  busy = false;
  error = '';
  decisionError = '';
  message = '';
  private trigger: HTMLElement | null = null;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    if (this.loading) return;
    const owner = this.api.owner;
    this.loading = true;
    this.error = '';
    try {
      const records = await this.api.approvals();
      if (owner === this.api.owner) {
        this.records = records;
        this.selected = null;
      }
    } catch (error) {
      if (owner === this.api.owner)
        this.error = adminError(error, 'Assigned requests could not be loaded. Try again.');
    } finally {
      this.loading = false;
      this.detector.markForCheck();
    }
  }

  review(record: Approval, target: EventTarget | null): void {
    this.selected = record;
    this.decisionError = '';
    this.trigger = target instanceof HTMLElement ? target : null;
    this.detector.detectChanges();
    this.reviewHeading?.nativeElement.focus();
  }

  close(): void {
    this.selected = null;
    this.trigger?.focus();
  }

  async decide(decision: 'approve' | 'decline'): Promise<void> {
    if (this.busy || !this.selected) return;
    const record = this.selected;
    const owner = this.api.owner;
    this.busy = true;
    this.decisionError = '';
    try {
      await this.api.decide(record.requestGuid, decision);
      if (owner !== this.api.owner) return;
      this.message = `${record.displayName}’s request ${decision === 'approve' ? 'approved' : 'declined'}. Only pending dates were changed.`;
      this.selected = null;
      await this.load();
      this.detector.detectChanges();
      this.inboxHeading?.nativeElement.focus();
    } catch (error) {
      if (owner === this.api.owner)
        this.decisionError = adminError(
          error,
          'The decision was not confirmed. Review the request and try again.',
        );
    } finally {
      this.busy = false;
      this.detector.markForCheck();
    }
  }

  pending(record: Approval): number {
    return record.dates.filter((date) => date.status === 'Pending').length;
  }
}

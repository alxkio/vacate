import { Router } from '@angular/router';
import { publicGuid } from '../../core/navigation/app-paths';
import { DataTable } from '../../shared/data-table/data-table';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AdminApi, adminError, Approval } from './admin-api';

@Component({
  selector: 'vacate-approvals',
  imports: [DataTable],
  templateUrl: './approvals.html',
  styleUrl: './admin.scss',
})
export class Approvals implements OnInit, OnChanges {
  @Input() requestGuid = '';
  private readonly router = inject(Router, { optional: true });
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
  message =
    history.state?.decisionOwner === this.api.owner ? history.state.decisionMessage || '' : '';
  private trigger: HTMLElement | null = null;

  ngOnChanges(): void {
    this.selectRequested();
  }

  private selectRequested(): void {
    if (!this.requestGuid) return;
    this.selected = publicGuid.test(this.requestGuid)
      ? this.records.find((r) => r.requestGuid.toLowerCase() === this.requestGuid.toLowerCase()) ||
        null
      : null;
    if (!this.selected && !this.loading && !this.error)
      this.decisionError = 'This pending request is unavailable or is not assigned to you.';
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
      const records = await this.api.approvals();
      if (owner === this.api.owner) {
        this.records = records;
        this.selected = null;
        this.decisionError = '';
        this.selectRequested();
      }
    } catch (error) {
      if (owner === this.api.owner)
        this.error = adminError(error, 'Assigned requests could not be loaded. Try again.');
    } finally {
      this.loading = false;
      this.selectRequested();
      this.detector.markForCheck();
    }
  }

  review(record: Approval, target: EventTarget | null): void {
    if (this.router && publicGuid.test(record.requestGuid)) {
      void this.router.navigate(['/approvals', record.requestGuid]);
      return;
    }
    this.selected = record;
    this.decisionError = '';
    this.trigger = target instanceof HTMLElement ? target : null;
    this.detector.detectChanges();
    this.reviewHeading?.nativeElement.focus();
  }

  close(): void {
    if (this.requestGuid && this.router) {
      void this.router.navigate(['/approvals']);
      return;
    }
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
      if (this.requestGuid && this.router) {
        await this.router.navigate(['/approvals'], {
          state: { decisionMessage: this.message, decisionOwner: this.api.owner },
        });
        return;
      }
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

import { ChangeDetectorRef, Component, inject, Input, OnChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { publicGuid } from '../../core/navigation/app-paths';
import { LeaveRequests, SavedRequest } from './data-access/leave-requests';
import { CancelRequest } from './cancel-request';

@Component({
  selector: 'vacate-request-detail',
  imports: [RouterLink, CancelRequest],
  template: `
    <section class="navigation-card" aria-labelledby="request-detail-heading">
      <a routerLink="/leave">Back to my leave</a>
      <h2 id="request-detail-heading">Saved leave request</h2>
      @if (loading) {
        <p role="status">Loading your request…</p>
      }
      @if (error) {
        <p role="alert">{{ error }}</p>
        <button class="secondary" (click)="load()">Retry request</button>
      }
      @if (request; as record) {
        <p>Submitted {{ record.createdAt }}</p>
        <vacate-cancel-request [request]="record" (changed)="load()" />
      } @else if (!loading && !error) {
        <p role="alert">This request is unavailable for your account.</p>
      }
    </section>
  `,
})
export class RequestDetail implements OnChanges {
  readonly leave = inject(LeaveRequests);
  private readonly detector = inject(ChangeDetectorRef);
  @Input() requestGuid = '';
  request: SavedRequest | null = null;
  loading = false;
  error = '';
  private sequence = 0;

  ngOnChanges(): void {
    void this.load();
  }

  async load(): Promise<void> {
    const sequence = ++this.sequence;
    const guid = this.requestGuid;
    this.request = null;
    this.error = '';
    if (!publicGuid.test(guid)) return;
    this.loading = true;
    await this.leave.refresh();
    if (sequence !== this.sequence) return;
    this.request =
      this.leave.requests.find((r) => r.guid.toLowerCase() === guid.toLowerCase()) || null;
    this.error = this.leave.error();
    this.loading = false;
    this.detector.markForCheck();
  }
}

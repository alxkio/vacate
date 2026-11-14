import { inject, Injectable, signal } from '@angular/core';
import { Entry } from '../../../core/models/workspace.models';
import { WorkspaceDataService } from '../../../core/state/workspace-data.service';

export type LeaveDraft = {
  leaveTypeId: string;
  unit: 'days' | 'hours';
  mode: 'duration' | 'range';
  startDate: string;
  endDate?: string;
  duration?: number;
};
export type LeavePreview = {
  startDate: string;
  endDate: string;
  workingDates: string[];
  excludedDates: { date: string; reason: string }[];
  coveredDates: string[];
  newDates: string[];
  amount: number;
  balances: {
    leaveTypeId: string;
    year: number;
    allocation: number;
    used: number;
    pending: number;
    available: number;
    requested: number;
    projected: number;
  }[];
  warnings: string[];
  errors: string[];
  canSubmit: boolean;
  fingerprint?: string;
};
export type SavedRequest = {
  guid: string;
  leaveTypeId: string;
  createdAt: string;
  source?: string;
  closureGuid?: string | null;
  dates: {
    date: string;
    status: 'Approved' | 'Pending' | 'Declined' | 'Cancelled' | 'Expired';
    entitlementYear: number;
    canCancel?: boolean;
  }[];
};
export type SubmitResult = {
  outcome: 'created' | 'already-covered';
  request: SavedRequest | null;
  preview: LeavePreview;
};

@Injectable({ providedIn: 'root' })
export class LeaveRequests {
  private readonly data = inject(WorkspaceDataService);
  private readonly records = signal<{
    owner: string;
    entries: Entry[];
    requests: SavedRequest[];
  } | null>(null);
  private readonly feedback = signal<{ owner: string; loading: boolean; error: string } | null>(
    null,
  );
  readonly loading = () => this.feedback()?.owner === this.owner && !!this.feedback()?.loading;
  readonly error = () => (this.feedback()?.owner === this.owner ? this.feedback()!.error : '');
  private refreshSequence = 0;

  get entries(): Entry[] {
    return this.records()?.owner === this.owner ? this.records()!.entries : [];
  }

  get requests(): SavedRequest[] {
    return this.records()?.owner === this.owner ? this.records()!.requests : [];
  }

  private get owner(): string {
    const actor = this.data.currentUser();
    return actor ? `${actor.companyId}:${actor.id}:${this.data.api?.sessionGeneration ?? 0}` : '';
  }

  private request<T>(method: string, resource: string, body?: unknown): Promise<T> {
    const actor = this.data.currentUser();
    if (!actor || !this.data.api.authenticatedRequest) {
      return Promise.reject(Error('The leave API is unavailable. Your draft has not been saved.'));
    }
    return this.data.api.authenticatedRequest<T>(
      actor.id,
      method,
      `organizations/${actor.companyId}/leave/${resource}`,
      body,
    );
  }

  preview(draft: LeaveDraft): Promise<LeavePreview> {
    return this.request('POST', 'preview', draft);
  }

  submit(
    draft: LeaveDraft,
    idempotencyKey: string,
    previewFingerprint?: string,
  ): Promise<SubmitResult> {
    return this.request('POST', 'requests', { ...draft, idempotencyKey, previewFingerprint });
  }

  cancel(guid: string, dates: string[]): Promise<SavedRequest> {
    return this.request('POST', `requests/${guid}/cancel`, { dates });
  }

  async refresh(): Promise<void> {
    const owner = this.owner;
    const sequence = ++this.refreshSequence;
    const actor = this.data.currentUser();
    if (!actor || !this.data.api.authenticatedRequest) {
      return;
    }
    this.feedback.set({ owner, loading: true, error: '' });
    try {
      const [requests, dates] = await Promise.all([
        this.request<SavedRequest[]>('GET', 'requests'),
        this.request<{ requestGuid: string; leaveTypeId: string; date: string; status: string }[]>(
          'GET',
          'calendar',
        ),
        this.data.api.refreshWorkspace?.(),
      ]);
      if (owner !== this.owner || sequence !== this.refreshSequence) {
        return;
      }
      this.records.set({
        owner,
        requests,
        entries: dates.map((date) => ({
          id: `saved:${date.requestGuid}:${date.date}`,
          person: actor.id,
          companyId: actor.companyId,
          start: date.date,
          end: date.date,
          type: date.leaveTypeId,
          title: requests.find((request) => request.guid === date.requestGuid)?.closureGuid
            ? `Company closure · ${date.leaveTypeId === 'company-closure' ? 'No balance impact' : 'Annual leave'}`
            : this.data.typeName(date.leaveTypeId),
          status: date.status,
          amount: 1,
          unit: 'working days',
        })),
      });
      this.feedback.set({ owner, loading: false, error: '' });
    } catch {
      if (owner === this.owner && sequence === this.refreshSequence) {
        this.feedback.set({
          owner,
          loading: false,
          error:
            'Saved leave could not be refreshed. Retry before relying on this calendar or history.',
        });
      }
    }
  }
}

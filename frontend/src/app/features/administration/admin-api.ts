import { inject, Injectable } from '@angular/core';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { SavedRequest } from '../leave/data-access/leave-requests';

export type Holiday = { guid: string; name: string; month: number; day: number };
export type ClosureDraft = {
  name: string;
  startDate: string;
  endDate: string;
  deductAnnualLeave: boolean;
};
export type ClosureResult = {
  userGuid: string;
  displayName: string;
  outcome: 'recorded' | 'skipped' | 'already-covered';
  days: number;
  reason: string | null;
};
export type Closure = ClosureDraft & { guid: string; results: ClosureResult[] };
export type Approver = {
  scope: 'organization' | 'department' | 'team';
  scopeGuid: string;
  approverGuid: string;
};
export type AdminCalendar = {
  holidays: Holiday[];
  closures: Closure[];
  approvers: Approver[];
  candidates: { guid: string; displayName: string }[];
};
export type Approval = {
  requestGuid: string;
  userGuid: string;
  displayName: string;
  leaveTypeId: string;
  createdAt: string;
  dates: { date: string; status: string; entitlementYear: number }[];
};
export type Personnel = {
  userGuid: string;
  displayName: string;
  departmentName: string | null;
  teamName: string | null;
  year: number;
  allocation: number | null;
  used: number;
  pending: number;
  available: number | null;
  openingUsed: number;
  requests: SavedRequest[];
};

export function adminError(error: unknown, fallback: string): string {
  const response = error as { status?: number; error?: { error?: string; message?: string } };
  const detail = response.error?.message || response.error?.error;
  if (
    response.status === 0 ||
    (detail &&
      /^(?:TypeError: )?(?:Failed to fetch|Network request failed|Load failed)$/i.test(detail))
  )
    return fallback;
  if (response.status === 403)
    return 'You do not have access to this action in this company. Refresh to review your current permissions and assignments.';
  if (response.status === 409) {
    return `${detail || 'The action conflicts with the current saved state.'} Refresh and review the latest saved values before trying again.`;
  }
  return detail || fallback;
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  readonly data = inject(WorkspaceDataService);
  get owner(): string {
    const actor = this.data.currentUser();
    return actor ? `${actor.companyId}:${actor.id}:${this.data.api.sessionGeneration}` : '';
  }

  request<T>(method: string, resource: string, body?: unknown): Promise<T> {
    const actor = this.data.currentUser();
    if (!actor || actor.capability !== 'admin')
      return Promise.reject(Error('Administrator access is required.'));
    return this.data.api.authenticatedRequest<T>(
      actor.id,
      method,
      `organizations/${actor.companyId}/admin/${resource}`,
      body,
    );
  }

  calendar(): Promise<AdminCalendar> {
    return this.request('GET', 'calendar');
  }
  addHoliday(body: Pick<Holiday, 'name' | 'month' | 'day'>): Promise<Holiday> {
    return this.request('POST', 'holidays', body);
  }
  previewClosure(body: ClosureDraft): Promise<ClosureDraft & { results: ClosureResult[] }> {
    return this.request('POST', 'closures/preview', body);
  }
  addClosure(body: ClosureDraft, idempotencyKey: string): Promise<Closure> {
    return this.request('POST', 'closures', { ...body, idempotencyKey });
  }
  saveApprover(
    body: Omit<Approver, 'approverGuid'> & { approverGuid: string | null },
  ): Promise<AdminCalendar> {
    return this.request('PUT', 'approvers', body);
  }
  approvals(): Promise<Approval[]> {
    return this.request('GET', 'approvals');
  }
  decide(requestGuid: string, decision: 'approve' | 'decline'): Promise<Approval> {
    return this.request('POST', `approvals/${requestGuid}/decision`, { decision });
  }
  personnel(year: number): Promise<Personnel[]> {
    return this.request('GET', `personnel?year=${year}`);
  }
}

import { TestBed } from '@angular/core/testing';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { MyLeave } from './my-leave';

const requests = [
  {
    guid: 'old',
    leaveTypeId: 'annual',
    createdAt: '2025-01-01T00:00:00Z',
    dates: [{ date: '2025-01-06', status: 'Approved' as const, entitlementYear: 2025 }],
  },
  {
    guid: 'pending',
    leaveTypeId: 'study',
    createdAt: '2026-01-01T00:00:00Z',
    dates: [{ date: '2026-11-20', status: 'Pending' as const, entitlementYear: 2026 }],
  },
  {
    guid: 'expired',
    leaveTypeId: 'annual',
    createdAt: '2026-01-01T00:00:00Z',
    dates: [{ date: '2026-01-06', status: 'Expired' as const, entitlementYear: 2026 }],
  },
];

describe('My Leave history', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [MyLeave], providers: [fixtureWorkspaceProvider] });
    TestBed.inject(WorkspaceDataService).environment.VacateSession.login('maya', 'maya');
  });
  afterEach(() => sessionStorage.clear());

  it('puts collapsed balances before one all-years saved history table, with no separate reference history', () => {
    const fixture = TestBed.createComponent(MyLeave);
    fixture.componentRef.setInput('savedRequests', requests);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('details')?.open).toBe(false);
    expect(element.querySelector('#saved-leave-requests tbody')?.children.length).toBe(3);
    expect(element.textContent).not.toContain('Fictional reference history');
    expect(fixture.componentInstance.rows.map((row) => row.day.date)).toEqual([
      '2026-11-20',
      '2026-01-06',
      '2025-01-06',
    ]);
  });

  it('combines status, type and inclusive date filters and resets them', () => {
    const fixture = TestBed.createComponent(MyLeave);
    fixture.componentRef.setInput('savedRequests', requests);
    const page = fixture.componentInstance;
    page.status = 'Approved';
    page.type = 'annual';
    page.from = '2025-01-06';
    page.to = '2025-01-06';
    fixture.detectChanges();
    expect(page.rows.map((row) => row.request.guid)).toEqual(['old']);
    page.type = 'study';
    expect(page.rows).toEqual([]);
    page.reset();
    expect(page.rows.length).toBe(3);
  });

  it('distinguishes loading, unavailable and empty history with retry', () => {
    const fixture = TestBed.createComponent(MyLeave);
    fixture.componentRef.setInput('savedLoading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading saved requests');
    expect(fixture.nativeElement.textContent).not.toContain('No saved requests');
    fixture.componentRef.setInput('savedLoading', false);
    fixture.componentRef.setInput('savedError', 'Network unavailable');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('No saved requests');
    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => retries++);
    fixture.nativeElement.querySelector('button.secondary').click();
    expect(retries).toBe(1);
    fixture.componentRef.setInput('savedError', '');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No saved requests');
  });
});

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CancelRequest } from './cancel-request';
import { LeaveRequests } from './data-access/leave-requests';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';

describe('Own request cancellation', () => {
  const request = {
    guid: 'own',
    leaveTypeId: 'annual',
    createdAt: '',
    dates: [
      { date: '2026-01-01', status: 'Approved', canCancel: false },
      { date: '2027-01-04', status: 'Pending', canCancel: true },
      { date: '2027-01-05', status: 'Pending', canCancel: true },
    ],
  };

  it('offers all eligible dates or a subset and keeps the draft on failure until the server confirms', async () => {
    const cancel = vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce({});
    const refresh = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [CancelRequest],
      providers: [
        { provide: LeaveRequests, useValue: { cancel, refresh } },
        {
          provide: WorkspaceDataService,
          useValue: {
            currentUser: () => ({ id: 'owner' }),
            api: { sessionGeneration: 1, refresh },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(CancelRequest);
    fixture.componentRef.setInput('request', request);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.begin();
    expect([...page.selected]).toEqual(['2027-01-04', '2027-01-05']);
    page.toggle('2027-01-05');
    await page.save();
    expect(cancel).toHaveBeenCalledWith('own', ['2027-01-04']);
    expect(page.editing).toBe(true);
    expect(page.error).toContain('not confirmed');
    await page.save();
    expect(page.editing).toBe(false);
    expect(page.message).toContain('cancelled');
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('discards a successful old-session response', async () => {
    let resolve!: () => void;
    let generation = 1;
    const refresh = vi.fn();
    TestBed.configureTestingModule({
      imports: [CancelRequest],
      providers: [
        {
          provide: LeaveRequests,
          useValue: { cancel: () => new Promise<void>((done) => (resolve = done)), refresh },
        },
        {
          provide: WorkspaceDataService,
          useValue: {
            currentUser: () => ({ id: 'owner' }),
            api: {
              get sessionGeneration() {
                return generation;
              },
              refresh,
            },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(CancelRequest);
    fixture.componentRef.setInput('request', request);
    const page = fixture.componentInstance;
    page.begin();
    const saving = page.save();
    generation++;
    resolve();
    await saving;
    expect(refresh).not.toHaveBeenCalled();
    expect(page.message).toBe('');
  });
});

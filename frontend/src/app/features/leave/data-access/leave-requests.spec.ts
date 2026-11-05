import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { WorkspaceDataService } from '../../../core/state/workspace-data.service';
import { LeaveRequests } from './leave-requests';

type ApiCall = (actor: string, method: string, path: string, body?: unknown) => Promise<unknown>;

describe('Saved leave session isolation', () => {
  const actor = { id: 'actor', companyId: 'company' };
  let generation: number;
  let request: ReturnType<typeof vi.fn<ApiCall>>;

  beforeEach(() => {
    generation = 1;
    request = vi.fn<ApiCall>().mockImplementation(async (_actor, _method, path) =>
      path.endsWith('/calendar')
        ? [
            {
              requestGuid: 'saved',
              leaveTypeId: 'annual',
              date: '2026-11-06',
              status: 'Approved',
            },
          ]
        : [
            {
              guid: 'saved',
              leaveTypeId: 'annual',
              createdAt: '2026-11-05T10:00:00Z',
              dates: [],
            },
          ],
    );
    TestBed.configureTestingModule({
      providers: [
        LeaveRequests,
        {
          provide: WorkspaceDataService,
          useValue: {
            currentUser: () => actor,
            typeName: () => 'Annual',
            api: {
              get sessionGeneration() {
                return generation;
              },
              authenticatedRequest: (
                actorId: string,
                method: string,
                path: string,
                body?: unknown,
              ) => request(actorId, method, path, body),
            },
          },
        },
      ],
    });
  });

  it('does not expose the previous session cache after the same actor signs in again', async () => {
    const leaves = TestBed.inject(LeaveRequests);
    await leaves.refresh();
    expect(leaves.entries.length).toBe(1);
    generation++;
    expect(leaves.entries).toEqual([]);
    expect(leaves.requests).toEqual([]);
  });

  it('discards an in-flight refresh after the session changes for the same actor', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = request.getMockImplementation()!;
    request.mockImplementation(async (...args) => {
      await pending;
      return original(...args);
    });
    const leaves = TestBed.inject(LeaveRequests);
    const refresh = leaves.refresh();
    generation++;
    release();
    await refresh;
    expect(leaves.entries).toEqual([]);
    expect(leaves.requests).toEqual([]);
  });
});

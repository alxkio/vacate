import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { AdminApi } from '../administration/admin-api';
import { People } from './people';

describe('Directory recovery', () => {
  it('offers retry after a failure and renders the successful response', async () => {
    const directory = vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce([]);
    TestBed.configureTestingModule({
      imports: [People],
      providers: [
        {
          provide: WorkspaceDataService,
          useValue: {
            currentUser: () => ({ id: 'maya', capability: 'employee' }),
            api: { directory, sessionGeneration: 1 },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(People);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await vi.waitFor(() =>
      expect(fixture.componentInstance.error).toContain('People could not be loaded'),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('People could not be loaded');
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.loading).toBe(false));
    fixture.detectChanges();
    expect(directory).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('No people available');
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
  });

  it('discards directory results after the session changes', async () => {
    let resolve!: (people: unknown[]) => void;
    let generation = 1;
    TestBed.configureTestingModule({
      imports: [People],
      providers: [
        {
          provide: WorkspaceDataService,
          useValue: {
            currentUser: () => ({ id: 'maya', capability: 'employee' }),
            api: {
              directory: () =>
                new Promise((r) => {
                  resolve = r;
                }),
              get sessionGeneration() {
                return generation;
              },
            },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(People);
    fixture.detectChanges();
    generation++;
    resolve([
      { firstName: 'Previous session', username: 'private', email: 'private@example.invalid' },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.people).toEqual([]);
    expect(fixture.nativeElement.textContent).not.toContain('Previous session');
  });
});

describe('People annual report ownership', () => {
  it('keeps the loaded year truthful while another year is entered and rejects a stale session response', async () => {
    const pending: ((value: unknown[]) => void)[] = [];
    let generation = 1;
    const api = { personnel: vi.fn(() => new Promise((resolve) => pending.push(resolve))) };
    TestBed.configureTestingModule({
      imports: [People],
      providers: [
        { provide: AdminApi, useValue: api },
        {
          provide: WorkspaceDataService,
          useValue: {
            currentUser: () => ({ id: 'admin', capability: 'admin' }),
            api: {
              refresh: async () => {},
              directory: async () => [],
              get sessionGeneration() {
                return generation;
              },
            },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(People);
    fixture.detectChanges();
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    const loadedYear = fixture.componentInstance.year;
    fixture.componentInstance.year = loadedYear + 1;
    await fixture.componentInstance.loadPeople();
    expect(api.personnel).toHaveBeenCalledTimes(1);
    pending[0]([{ userGuid: 'saved', displayName: 'Saved report' }]);
    await vi.waitFor(() => expect(fixture.componentInstance.loading).toBe(false));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.loadedYear).toBe(loadedYear);
    expect(fixture.componentInstance.balances[0].displayName).toBe('Saved report');
    const next = fixture.componentInstance.loadPeople();
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    generation++;
    pending[1]([{ userGuid: 'stale', displayName: 'Stale session' }]);
    await next;
    expect(fixture.componentInstance.balances[0].displayName).toBe('Saved report');
    expect(fixture.componentInstance.loadedYear).toBe(loadedYear);
  });
});

describe('People hierarchy navigation', () => {
  it('filters named groups by GUID, preserving search and non-colour self identification', async () => {
    const departmentA = '20000000-0000-4000-8000-000000000300';
    const departmentB = '20000000-0000-4000-8000-000000000301';
    const teamA = '20000000-0000-4000-8000-000000000400';
    const teamB = '20000000-0000-4000-8000-000000000401';
    const rows = [
      {
        guid: '10000000-0000-4000-8000-000000000001',
        username: 'maya',
        email: 'maya@example.invalid',
        firstName: 'Maya',
        middleName: null,
        lastName: 'Example',
        gender: '',
        jobTitle: null,
        systemRole: null,
        departmentId: departmentA,
        departmentName: 'Technology',
        teamId: teamA,
        teamName: 'Support',
      },
      {
        guid: '10000000-0000-4000-8000-000000000002',
        username: 'nora',
        email: 'nora@example.invalid',
        firstName: 'Nora',
        middleName: null,
        lastName: 'Example',
        gender: '',
        jobTitle: null,
        systemRole: null,
        departmentId: departmentB,
        departmentName: 'Operations',
        teamId: teamB,
        teamName: 'Support',
      },
    ];
    TestBed.configureTestingModule({
      imports: [People],
      providers: [
        {
          provide: WorkspaceDataService,
          useValue: {
            currentUser: () => ({
              id: rows[0].guid,
              companyId: 'company',
              email: rows[0].email,
              teamId: teamA,
              departmentId: departmentA,
              capability: 'employee',
            }),
            api: { directory: async () => rows, sessionGeneration: 1 },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(People);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.people).toHaveLength(2));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.people-filters optgroup').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('You');
    expect(fixture.nativeElement.querySelector('h2')).toBeNull();
    expect(fixture.nativeElement.querySelector('.people-legend')).toBeNull();
    page.selectGroup('team:' + teamA);
    expect(page.filtered.map((person) => person.firstName)).toEqual(['Maya']);
    page.selectGroup('department:' + departmentB);
    expect(page.filtered.map((person) => person.firstName)).toEqual(['Nora']);
    page.search = 'Maya';
    expect(page.filtered).toEqual([]);
    page.selectGroup('all');
    expect(page.filtered.map((person) => person.firstName)).toEqual(['Maya']);
    page.search = '';
    page.selectGroup('team:20000000-0000-4000-8000-000000000499');
    expect(page.filtered).toEqual([]);
    page.selectGroup('all');
    expect(page.listQuery).toEqual({});
  });
});

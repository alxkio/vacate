import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { AdminApi } from '../administration/admin-api';
import { PersonDetail } from './person-detail';

const personGuid = '10000000-0000-4000-8000-000000000001';
const membershipGuid = '30000000-0000-4000-8000-000000000001';
const companyId = '20000000-0000-4000-8000-000000000001';

describe('Person detail resource boundaries', () => {
  let actor: { id: string; companyId: string; capability: string };
  let owner: string;
  let data: any;

  beforeEach(() => {
    actor = { id: 'admin', companyId, capability: 'admin' };
    owner = 'company:admin:1';
    data = {
      currentUser: () => actor,
      api: {
        refresh: vi.fn(async () => {}),
        directory: vi.fn(async () => [
          {
            guid: personGuid,
            firstName: 'Fictional',
            lastName: 'Member',
            email: 'fiction@example.invalid',
          },
        ]),
        members: [{ userGuid: personGuid, membership: { guid: membershipGuid, companyId } }],
      },
    };
    TestBed.configureTestingModule({
      imports: [PersonDetail],
      providers: [
        provideRouter([]),
        { provide: WorkspaceDataService, useValue: data },
        {
          provide: AdminApi,
          useValue: {
            get owner() {
              return owner;
            },
            personnel: vi.fn(async () => []),
          },
        },
      ],
    });
  });

  it('shows permitted identity but never another person’s family fields', async () => {
    const fixture = TestBed.createComponent(PersonDetail);
    fixture.componentRef.setInput('personGuid', personGuid);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.loading).toBe(false));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Fictional Member');
    expect(fixture.nativeElement.textContent).toContain('fiction@example.invalid');
    expect(fixture.nativeElement.querySelector('[name="married"]')).toBeNull();
  });

  it('keeps the overview above recorded leave by default with a switch to membership editing', async () => {
    const fixture = TestBed.createComponent(PersonDetail);
    fixture.componentRef.setInput('personGuid', personGuid);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.loading).toBe(false));
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('dl')).not.toBeNull();
    expect(element.querySelector('#person-history')?.textContent).toContain('Recorded leave');
    expect(element.querySelector('vacate-organization')).toBeNull();
    expect(element.querySelector('[data-edit-membership]')).not.toBeNull();
    expect(element.querySelector('[data-show-leave]')).toBeNull();
  });

  it.each(['employee', 'malformed', 'foreign-company', 'mismatched-membership'])(
    'does not expose a private person or editor for %s',
    async (kind) => {
      if (kind === 'employee') actor.capability = 'employee';
      if (kind === 'foreign-company') data.api.members[0].membership.companyId = 'other';
      const fixture = TestBed.createComponent(PersonDetail);
      fixture.componentRef.setInput('personGuid', kind === 'malformed' ? 'maya' : personGuid);
      if (kind === 'mismatched-membership')
        fixture.componentRef.setInput('membershipGuid', '30000000-0000-4000-8000-000000000099');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Person unavailable');
      expect(fixture.nativeElement.textContent).not.toContain('fiction@example.invalid');
      expect(fixture.nativeElement.querySelector('vacate-organization')).toBeNull();
      expect(data.api.directory).not.toHaveBeenCalled();
    },
  );

  it('rejects a late directory response after an account/session change', async () => {
    let resolve!: (value: unknown[]) => void;
    data.api.directory = vi.fn(() => new Promise((r) => (resolve = r)));
    const fixture = TestBed.createComponent(PersonDetail);
    fixture.componentRef.setInput('personGuid', personGuid);
    fixture.detectChanges();
    await vi.waitFor(() => expect(data.api.directory).toHaveBeenCalled());
    owner = 'different:actor:2';
    resolve([
      {
        guid: personGuid,
        firstName: 'Stale secret',
        lastName: 'Member',
        email: 'private@example.invalid',
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Stale secret');
    expect(fixture.componentInstance.person).toBeNull();
  });
});

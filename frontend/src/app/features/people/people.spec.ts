import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
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
    expect(fixture.nativeElement.textContent).toContain('People could not be loaded');
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
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

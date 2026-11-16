import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { LeavePreview, LeaveRequests } from './data-access/leave-requests';
import { Request } from './request';

const calculated = (overrides: Partial<LeavePreview> = {}): LeavePreview => ({
  startDate: '2026-11-08',
  endDate: '2026-11-10',
  workingDates: ['2026-11-09', '2026-11-10'],
  excludedDates: [{ date: '2026-11-08', reason: 'Sunday is not a working day' }],
  coveredDates: [],
  newDates: ['2026-11-09', '2026-11-10'],
  amount: 2,
  balances: [
    {
      leaveTypeId: 'annual',
      year: 2026,
      allocation: 20,
      used: 5,
      pending: 0,
      available: 15,
      requested: 2,
      projected: 13,
    },
  ],
  warnings: [],
  errors: [],
  canSubmit: true,
  ...overrides,
});

describe('Leave request form', () => {
  let preview: ReturnType<typeof vi.fn>;
  let submit: ReturnType<typeof vi.fn>;
  let refresh: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    preview = vi.fn().mockResolvedValue(calculated());
    submit = vi.fn().mockResolvedValue({
      outcome: 'already-covered',
      request: null,
      preview: calculated({ amount: 0 }),
    });
    refresh = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [Request],
      providers: [
        fixtureWorkspaceProvider,
        { provide: LeaveRequests, useValue: { preview, submit, refresh, error: () => '' } },
      ],
    });
    TestBed.inject(WorkspaceDataService).environment.VacateSession.login('maya', 'maya');
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  async function setup() {
    const fixture = TestBed.createComponent(Request);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(250);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    return fixture;
  }

  it('marks reversed and missing date fields, clears stale preview, and allows past dates with warnings', async () => {
    const fixture = await setup();
    const page = fixture.componentInstance;
    page.start = '2026-11-10';
    page.end = '2026-11-09';
    page.queuePreview();
    expect(page.endError).toContain('on or after');
    await vi.advanceTimersByTimeAsync(0);
    page.changeDetector.detectChanges();
    expect(fixture.nativeElement.querySelector('#end-date').getAttribute('aria-invalid')).toBe(
      'true',
    );
    expect(page.canSubmit).toBe(false);
    expect(page.preview).toBeNull();
    page.end = '';
    expect(page.endError).toContain('valid end date');
    page.end = '2026-11-10';
    page.start = '2020-01-01';
    page.queuePreview();
    await vi.advanceTimersByTimeAsync(250);
    expect(page.pastDateWarning).toContain('past dates');
    expect(page.canSubmit).toBe(true);
    page.switchMode('duration');
    page.amount = '';
    page.queuePreview();
    expect(page.amountError).toContain('positive whole number');
    expect(page.canSubmit).toBe(false);
  });

  it('shows server amount and only selected-type balance, includes excluded date explanation', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('#request-amount-preview').textContent).toContain(
      '2 working days',
    );
    expect(fixture.nativeElement.querySelector('#request-balance').textContent).toContain(
      '15 days available',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Sunday is not a working day');
    const start = fixture.nativeElement.querySelector('#start-date') as HTMLInputElement;
    start.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(250);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sunday is not a working day');
    expect(fixture.componentInstance.canSubmit).toBe(true);
  });

  it('discloses type information on demand and omits routine eligible and empty-balance copy', async () => {
    preview.mockResolvedValue(calculated({ balances: [] }));
    const fixture = await setup();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#request-type-status')?.hasAttribute('hidden')).toBe(true);
    expect(root.querySelector('#request-eligibility')).toBeNull();
    expect(root.querySelector('#request-balance')).toBeNull();
    expect(root.textContent).not.toContain('Correct the highlighted fields');
    const info = root.querySelector('#request-type-info') as HTMLButtonElement;
    info.click();
    fixture.detectChanges();
    expect(info.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('#request-type-status')?.hasAttribute('hidden')).toBe(false);
    info.click();
    fixture.detectChanges();
    expect(info.getAttribute('aria-expanded')).toBe('false');
  });

  it('defers non-working-date warnings until input, suppresses routine fallback, and retains submission denial', async () => {
    preview.mockResolvedValue(
      calculated({
        canSubmit: false,
        errors: ['Select at least one working day.'],
        warnings: [
          'Public holiday data is unavailable for part of this range; the company working schedule is used for those dates.',
        ],
      }),
    );
    const fixture = await setup();
    expect(fixture.componentInstance.feedback).toEqual([]);
    expect(fixture.componentInstance.canSubmit).toBe(false);
    const start = fixture.nativeElement.querySelector('#start-date') as HTMLInputElement;
    start.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(250);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Choose a date range with working days.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Public holiday data is unavailable');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
  });

  it('places blocking configuration errors before the fields and preserves API denial', async () => {
    preview.mockResolvedValue(
      calculated({
        canSubmit: false,
        balances: [],
        errors: ['Annual allocation is not configured.'],
      }),
    );
    const fixture = await setup();
    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    expect(fieldset.firstElementChild?.tagName).toBe('VACATE-FEEDBACK-TOAST');
    expect(fieldset.querySelector('[role="alert"]')?.textContent).toContain(
      'Annual allocation is not configured.',
    );
    expect(fixture.componentInstance.canSubmit).toBe(false);
  });

  it('uses duration mode and derived end date; Hours hides end and blocks submission', async () => {
    const fixture = await setup();
    const page = fixture.componentInstance;
    page.amount = '2';
    page.switchMode('duration');
    await vi.advanceTimersByTimeAsync(250);
    expect(preview.mock.lastCall?.[0]).toMatchObject({ mode: 'duration', duration: 2 });
    expect(page.end).toBe('2026-11-10');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    const unit = fixture.nativeElement.querySelector('#request-unit') as HTMLSelectElement;
    unit.value = 'hours';
    unit.dispatchEvent(new Event('change'));
    await vi.advanceTimersByTimeAsync(0);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#end-date')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Hourly leave requests are not available yet',
    );
    expect(page.canSubmit).toBe(false);
    page.unit = 'working days';
    page.queuePreview();
    await vi.advanceTimersByTimeAsync(250);
    expect(page.canSubmit).toBe(true);
  });

  it('clears stale balances immediately and discards an older response', async () => {
    const fixture = await setup();
    const page = fixture.componentInstance;
    let resolveOld!: (value: LeavePreview) => void;
    preview.mockImplementationOnce(
      () =>
        new Promise<LeavePreview>((resolve) => {
          resolveOld = resolve;
        }),
    );
    page.queuePreview();
    await vi.advanceTimersByTimeAsync(250);
    page.setType('school');
    expect(page.preview).toBeNull();
    await vi.advanceTimersByTimeAsync(250);
    resolveOld(calculated({ amount: 99 }));
    await Promise.resolve();
    expect(page.preview?.amount).toBe(2);
  });

  it('preserves retry key and draft on failure; full overlap acknowledges without invented record', async () => {
    const fixture = await setup();
    const page = fixture.componentInstance;
    submit.mockRejectedValueOnce(Error('Network unavailable'));
    const start = page.start;
    await page.submit(new Event('submit'));
    expect(page.submitted).toBe(false);
    expect(page.start).toBe(start);
    await page.submit(new Event('submit'));
    expect(submit.mock.calls[0][1]).toBe(submit.mock.calls[1][1]);
    expect(page.savedOutcome).toBe('already-covered');
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('blocks negative/missing balances and prevents an account switch from submitting', async () => {
    preview.mockResolvedValue(
      calculated({ canSubmit: false, errors: ['Negative balance is not allowed.'] }),
    );
    const fixture = await setup();
    expect(fixture.componentInstance.canSubmit).toBe(false);
    TestBed.inject(WorkspaceDataService).environment.VacateSession.login('nora', 'nora');
    const stale = vi.fn();
    fixture.componentInstance.staleSession.subscribe(stale);
    await fixture.componentInstance.submit(new Event('submit'));
    expect(stale).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
  });
});

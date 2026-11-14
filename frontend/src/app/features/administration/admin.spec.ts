import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AdminApi, adminError } from './admin-api';
import { CompanyCalendar } from './company-calendar';
import { Approvals } from './approvals';
import { ApproverSettings } from './approver-settings';

const calendar = { holidays: [], closures: [], approvers: [], candidates: [] };

describe('Administrator company calendar', () => {
  it('requires server preview before publishing and preserves the idempotency key after a failed publish', async () => {
    const api = {
      owner: 'company:admin:1',
      calendar: vi.fn().mockResolvedValue(calendar),
      previewClosure: vi.fn().mockResolvedValue({ results: [] }),
      addClosure: vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce({
        guid: 'closure',
        name: 'Winter closure',
        startDate: '2027-01-04',
        endDate: '2027-01-05',
        deductAnnualLeave: true,
        results: [],
      }),
    };
    TestBed.configureTestingModule({
      imports: [CompanyCalendar],
      providers: [{ provide: AdminApi, useValue: api }],
    });
    const fixture = TestBed.createComponent(CompanyCalendar);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    // jsdom has no native dialog methods; browser acceptance verifies modal behavior.
    const dialog = fixture.nativeElement.querySelector('dialog');
    dialog.showModal = vi.fn();
    dialog.close = vi.fn();
    component.open('closure', null);
    component.name = 'Winter closure';
    component.startDate = '2027-01-04';
    component.endDate = '2027-01-05';
    component.deductAnnualLeave = true;
    await component.save();
    expect(api.previewClosure).toHaveBeenCalledWith({
      name: 'Winter closure',
      startDate: '2027-01-04',
      endDate: '2027-01-05',
      deductAnnualLeave: true,
    });
    expect(api.addClosure).not.toHaveBeenCalled();
    await component.save();
    expect(component.formError).toContain('Save was not confirmed');
    await component.save();
    expect(api.addClosure.mock.calls[0][1]).toMatch(/^[0-9a-f-]{36}$/);
    expect(api.addClosure.mock.calls[0][1]).toBe(api.addClosure.mock.calls[1][1]);
    expect(component.message).toContain('Closure published');
    expect(component.reportName).toBe('Winter closure');
    expect(fixture.nativeElement.querySelector('#closure-results-heading').textContent).toContain(
      'Winter closure',
    );
  });

  it('marks impossible recurring dates and invalid closure ranges before calling the API', async () => {
    const api = {
      owner: 'company:admin:1',
      calendar: vi.fn().mockResolvedValue(calendar),
      addHoliday: vi.fn(),
      previewClosure: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [CompanyCalendar],
      providers: [{ provide: AdminApi, useValue: api }],
    });
    const fixture = TestBed.createComponent(CompanyCalendar);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.name = 'Regional holiday';
    component.month = 2;
    component.day = 30;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.holidayMaxDay).toBe(29);
    expect(fixture.nativeElement.querySelector('[name=day]').getAttribute('aria-invalid')).toBe(
      'true',
    );
    expect(fixture.nativeElement.querySelector('#holiday-day-error').textContent).toContain(
      '1 to 29',
    );
    await component.save();
    expect(api.addHoliday).not.toHaveBeenCalled();
    component.day = 29;
    expect(component.holidayDayError).toBe('');
    component.month = 4;
    component.day = 31;
    expect(component.holidayDayError).not.toBe('');
    component.kind = 'closure';
    component.startDate = '2027-02-05';
    component.endDate = '2027-02-01';
    component.detector.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[name=endDate]').getAttribute('aria-invalid')).toBe(
      'true',
    );
    await component.save();
    expect(api.previewClosure).not.toHaveBeenCalled();
    expect(component.formError).toContain('on or after');
  });

  it('ignores company calendar responses after the actor changes', async () => {
    let resolve!: (value: unknown) => void;
    const api = {
      owner: 'company:admin:1',
      calendar: () =>
        new Promise((r) => {
          resolve = r;
        }),
    };
    TestBed.configureTestingModule({
      imports: [CompanyCalendar],
      providers: [{ provide: AdminApi, useValue: api }],
    });
    const fixture = TestBed.createComponent(CompanyCalendar);
    fixture.detectChanges();
    api.owner = 'other:admin:2';
    resolve({ ...calendar, holidays: [{ name: 'Private company holiday' }] });
    await fixture.whenStable();
    expect(fixture.componentInstance.record).toBeNull();
  });
});

describe('Assigned approval decisions', () => {
  it('keeps selected request on a conflict and reports success only after the API confirms', async () => {
    const request = {
      requestGuid: 'request',
      displayName: 'Employee',
      dates: [{ date: '2027-02-01', status: 'Pending' }],
    };
    const api = {
      owner: 'company:admin:1',
      approvals: vi.fn().mockResolvedValue([request]),
      decide: vi.fn().mockRejectedValueOnce({ status: 409 }).mockResolvedValueOnce(request),
      data: {
        typeName: () => 'Annual leave',
        api: { settingsAccess: { effectiveVacationApproval: false } },
      },
    };
    TestBed.configureTestingModule({
      imports: [Approvals],
      providers: [{ provide: AdminApi, useValue: api }],
    });
    const fixture = TestBed.createComponent(Approvals);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.selected = component.records[0];
    await component.decide('approve');
    expect(component.selected).not.toBeNull();
    expect(component.message).toBe('');
    expect(component.decisionError).toContain('Refresh');
    await component.decide('approve');
    expect(component.message).toContain('approved');
    expect(component.selected).toBeNull();
  });
});

describe('Administrator conflict feedback', () => {
  it('offers the caller recovery instruction for transport failures while retaining server validation detail', () => {
    const recovery = 'Save was not confirmed. Your entries are kept; retry saving.';
    expect(adminError({ status: 0, error: { message: 'Failed to fetch' } }, recovery)).toBe(
      recovery,
    );
    expect(
      adminError({ status: 502, error: { error: 'TypeError: Failed to fetch' } }, recovery),
    ).toBe(recovery);
    expect(
      adminError({ status: 400, error: { error: 'Choose a valid holiday date.' } }, recovery),
    ).toBe('Choose a valid holiday date.');
  });

  it('preserves the server explanation for duplicate holiday and stale decision conflicts', () => {
    expect(
      adminError(
        { status: 409, error: { error: 'A recurring holiday already exists on this date.' } },
        'Failed',
      ),
    ).toContain('A recurring holiday already exists on this date.');
    const stale = adminError(
      { status: 409, error: { error: 'This request has already been decided.' } },
      'Failed',
    );
    expect(stale).toContain('already been decided');
    expect(stale).toContain('Refresh');
    expect(adminError({ status: 409 }, 'Failed')).not.toContain('record changed');
  });
});

describe('Saved approver configuration explanation', () => {
  it('explains inheritance and unavailable explicit assignees without inventing fallback authority', () => {
    const company = '11111111-1111-4111-8111-111111111111';
    const team = '22222222-2222-4222-8222-222222222222';
    const department = '33333333-3333-4333-8333-333333333333';
    const api = {
      data: {
        currentUser: () => ({ companyId: company }),
        organization: {
          read: () => ({
            departments: [{ id: department, name: 'Operations' }],
            teams: [{ id: team, name: 'Support', departmentId: department }],
          }),
        },
      },
    };
    TestBed.configureTestingModule({
      imports: [ApproverSettings],
      providers: [{ provide: AdminApi, useValue: api }],
    });
    const component = TestBed.createComponent(ApproverSettings).componentInstance;
    component.scopeKey = `team:${team}`;
    component.record = {
      ...calendar,
      candidates: [{ guid: 'admin', displayName: 'Nora' }],
      approvers: [{ scope: 'organization', scopeGuid: company, approverGuid: 'admin' }],
    };
    expect(component.effectiveApprover).toContain('Nora · inherited from Organization default');
    component.record.approvers.unshift({
      scope: 'team',
      scopeGuid: team,
      approverGuid: 'deleted-admin',
    });
    expect(component.effectiveApprover).toContain('Configured administrator unavailable');
    expect(component.effectiveApprover).not.toContain('Nora');
    component.record.approvers = [{ scope: 'team', scopeGuid: team, approverGuid: 'admin' }];
    expect(component.effectiveApprover).toContain('Nora · assigned at Team');
    component.scopeKey = 'organization';
    expect(component.effectiveApprover).toContain('Not configured for this scope');
  });
});

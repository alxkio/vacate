import { TestBed } from '@angular/core/testing';
import { DemoData } from './demo-data';

describe('Angular demo data boundary', () => {
  let data: DemoData;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    data = TestBed.inject(DemoData);
  });
  afterEach(() => sessionStorage.clear());

  it('keeps the approved shortlist order after filtering Ravi’s unavailable types', () => {
    data.environment.VacateDemo.login('ravi', 'ravi');
    expect(data.visibleShortlist().map((type) => type.id)).toEqual([
      'annual',
      'sick',
      'paternity',
      'childcare',
      'parental',
      'school',
      'dependent-illness',
      'child-hospitalization',
      'voting',
      'study',
    ]);
  });

  it('keeps Maya’s own ledger separate from eligibility and country reference allowances', () => {
    data.environment.VacateDemo.login('maya', 'maya');
    expect(data.balance('annual')?.available).toBe(14);
    expect(data.decision('childcare').status).toBe('eligible');
    expect(data.balance('childcare')).toBeNull();
    expect(data.decision('marriage').status).toBe('not-eligible');
    expect(data.visibleShortlist().some((type) => type.id === 'marriage')).toBe(false);
    expect(data.catalogue.getType('marriage')?.allowance).toContain('5 working days');
  });

  it('does not return another account’s allocation from a forged company context', () => {
    const maya = data.fixtures.person('maya')!;
    data.environment.VacateDemo = {
      currentUser: () => ({ ...maya, companyId: 'foreign-company' }),
      login: () => false,
      logout: () => {},
    };
    expect(data.eligibility.getResponse()).toBeNull();
    expect(data.balance('annual')).toBeNull();
  });
});

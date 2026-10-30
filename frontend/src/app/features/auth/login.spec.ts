import { TestBed } from '@angular/core/testing';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { Login } from './login';

const personas = [
  ['maya', 'Employee', 'employee'],
  ['leah', 'Team lead', 'lead'],
  ['ella', 'Department lead', 'lead'],
  ['nora', 'Organization admin', 'admin'],
];

describe('Test persona chooser', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [Login], providers: [fixtureWorkspaceProvider] });
  });

  afterEach(() => sessionStorage.clear());

  it('offers one option per scenario while retaining all twelve people and their fixture data', () => {
    const data = TestBed.inject(WorkspaceDataService);
    const before = JSON.stringify({ people: data.fixtures.people, entries: data.fixtures.entries });
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const options = [
      ...fixture.nativeElement.querySelectorAll('#demo-account option'),
    ] as HTMLOptionElement[];
    expect(options.filter((option) => option.value).map((option) => option.value)).toEqual(
      personas.map(([id]) => id),
    );
    expect(data.fixtures.people).toHaveLength(12);
    expect(JSON.stringify({ people: data.fixtures.people, entries: data.fixtures.entries })).toBe(
      before,
    );
    expect(fixture.nativeElement.querySelector('.demo-credentials').textContent).not.toContain(
      'user / user',
    );
    expect(fixture.nativeElement.querySelector('.demo-credentials').textContent).not.toContain(
      'Every person',
    );
  });

  it.each(personas)(
    'fills the existing credentials for %s (%s) without changing its permissions',
    (id, label, capability) => {
      const data = TestBed.inject(WorkspaceDataService);
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const select = element.querySelector('#demo-account') as HTMLSelectElement;
      select.value = id;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect((element.querySelector('#username') as HTMLInputElement).value).toBe(id);
      expect((element.querySelector('#password') as HTMLInputElement).value).toBe(id);
      expect(element.querySelector('#persona-description')!.textContent).toContain(label);
      expect(data.fixtures.person(id)?.capability).toBe(capability);
      expect(data.fixtures.peopleFor(data.fixtures.person(id)!, 'org', 'foreign-company')).toEqual(
        [],
      );
      if (capability === 'lead')
        expect(data.fixtures.allowedScopes(data.fixtures.person(id)!)).toContain('department');
    },
  );
});

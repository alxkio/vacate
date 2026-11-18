import { TestBed } from '@angular/core/testing';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { of } from 'rxjs';
import { SessionApiService } from '../../core/http/session-api.service';
import { Login } from './login';

const personas = [
  ['maya', 'Employee'],
  ['leah', 'Team lead'],
  ['ella', 'Department lead'],
  ['nora', 'Organization admin'],
];

describe('Login screen', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        fixtureWorkspaceProvider,
        {
          provide: SessionApiService,
          useValue: {
            accounts: () =>
              of(personas.map(([id, label]) => ({ id, label, name: id, team: 'Saved team' }))),
          },
        },
      ],
    });
  });

  afterEach(() => sessionStorage.clear());

  it('lists the public demo accounts without a persona chooser or development notice', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#demo-account')).toBeNull();
    expect(element.textContent).not.toContain('test persona');
    expect(element.textContent).not.toContain('Development sign-in with public test accounts');
    const credentials = element.querySelector('.demo-credentials')!.textContent!;
    for (const [id, label] of personas) {
      expect(credentials).toContain(label);
      expect(credentials).toContain(`${id} / ${id}`);
    }
  });
});

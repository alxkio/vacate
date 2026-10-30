import { TestBed } from '@angular/core/testing';
import { fixtureWorkspaceProvider } from '../../../../testing/fixture-provider';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { UnifiedSettings } from './settings';

describe('Settings rendering authorization', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [UnifiedSettings],
      providers: [fixtureWorkspaceProvider],
    });
  });

  afterEach(() => sessionStorage.clear());

  it.each([
    ['leah', ['team', 'profile', 'system']],
    ['ella', ['department', 'team', 'profile', 'system']],
    ['nora', ['organization', 'department', 'team', 'profile', 'system']],
    ['daria', ['organization', 'department', 'team', 'profile', 'system']],
  ] as const)(
    'shows the delegated sections for %s and never infers organization administration from lead labels',
    async (account, sections) => {
      const data = TestBed.inject(WorkspaceDataService);
      data.environment.VacateSession.login(account, account);
      const fixture = TestBed.createComponent(UnifiedSettings);
      fixture.componentRef.setInput('companyId', 'northstar');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(
        Array.from(
          fixture.nativeElement.querySelectorAll('.settings-navigation button'),
          (button: any) => button.dataset.settingsSection,
        ),
      ).toEqual(sections);
    },
  );

  it.each(['organization', 'team'])(
    'never mounts %s for an employee even when the input bypasses routing',
    async (selected) => {
      const data = TestBed.inject(WorkspaceDataService);
      data.environment.VacateSession.login('maya', 'maya');
      const fixture = TestBed.createComponent(UnifiedSettings);
      fixture.componentRef.setInput('selected', selected);
      fixture.componentRef.setInput('companyId', 'northstar');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(
        fixture.nativeElement.querySelector(
          'vacate-organization, .dialog-list, [data-settings-section="organization"], [data-settings-section="team"]',
        ),
      ).toBeNull();
      expect(fixture.nativeElement.querySelector('#profile-form')).not.toBeNull();
    },
  );
});

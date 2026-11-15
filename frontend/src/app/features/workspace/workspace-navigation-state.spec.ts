import { WorkspaceNavigationState } from './workspace-navigation-state';
import { CalendarState } from '../../core/models/workspace.models';

describe('Calendar navigation context', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('restores a detached period after reload without sharing another account’s context', () => {
    const store = new WorkspaceNavigationState();
    const state = {
      scope: 'team',
      groupId: 'permitted-team',
      view: 'week',
      date: new Date(2026, 10, 5),
    } as CalendarState;
    store.save('company:actor', state);
    const reloaded = new WorkspaceNavigationState();
    expect(reloaded.read('company:actor')?.date.getDate()).toBe(5);
    const detached = reloaded.read('company:actor')!;
    detached.date.setDate(20);
    expect(reloaded.read('company:actor')?.date.getDate()).toBe(5);
    expect(reloaded.read('other-company:actor')).toBeNull();
    reloaded.clear();
    expect(new WorkspaceNavigationState().read('company:actor')).toBeNull();
  });

  it('ignores malformed browser state', () => {
    sessionStorage.setItem(
      'vacate.calendar.navigation.v1',
      '{"owner":"actor","state":{"date":"not-a-date"}}',
    );
    expect(new WorkspaceNavigationState().read('actor')).toBeNull();
  });
});

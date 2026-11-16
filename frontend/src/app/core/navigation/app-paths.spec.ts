import { workspaceQuery } from './app-paths';

describe('Feature-owned URL parameters', () => {
  const company = '20000000-0000-4000-8000-000000000100';

  it.each(['leave', 'balances', 'approvals', 'settings', 'help'])(
    'removes Calendar and report state from %s without discarding a foreign-company denial',
    (page) => {
      expect(
        workspaceQuery(
          page,
          { scope: 'org', date: '2026-11-05', view: 'month', year: '2020', q: 'private' },
          company,
          true,
        ),
      ).toEqual({});
      expect(workspaceQuery(page, { company: 'foreign-company' }, company, true)).toEqual({
        company: 'foreign-company',
      });
      expect(workspaceQuery(page, { company }, company, true)).toEqual({});
    },
  );

  it('omits default People scope/year and retains named historical group selection', () => {
    expect(
      workspaceQuery(
        'people',
        { scope: 'org', year: String(new Date().getFullYear()), date: '2026-11-05', q: 'private' },
        company,
        true,
      ),
    ).toEqual({});
    expect(
      workspaceQuery(
        'people',
        { scope: 'team', group: 'public-team-guid', year: '2000' },
        company,
        true,
      ),
    ).toEqual({ scope: 'team', group: 'public-team-guid', year: '2000' });
    expect(
      workspaceQuery(
        'people',
        { scope: 'org', group: 'irrelevant-group', year: '2000' },
        company,
        false,
      ),
    ).toEqual({});
  });

  it('retains Calendar compatibility state while removing other features’ parameters', () => {
    expect(
      workspaceQuery(
        'calendar',
        {
          scope: 'team',
          view: 'week',
          date: '2026-11-05',
          group: 'public-team-guid',
          page: 'people',
          year: '2000',
          history: 'marker',
        },
        company,
        false,
      ),
    ).toEqual({ scope: 'team', group: 'public-team-guid', view: 'week' });
  });
});

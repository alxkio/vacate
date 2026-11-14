import { createWorkspaceReadModel } from './workspace-read-model';
import { WorkspaceApiService } from './workspace-api.service';
import { Person } from '../models/workspace.models';

describe('Database workspace projection', () => {
  function setup() {
    let actor: Person | null = {
      id: 'new-user',
      personId: 'new-user',
      companyId: 'new-company',
      teamId: 'new-team',
      departmentId: 'new-dept',
      capability: 'employee',
    } as Person;
    const api = {
      currentUser: () => actor,
      workspace: {
        companyId: 'new-company',
        countryCode: 'GR',
        departments: [{ guid: 'new-dept', name: 'New department' }],
        teams: [{ guid: 'new-team', name: 'New team', departmentId: 'new-dept' }],
        people: [
          {
            guid: 'new-user',
            username: 'new@example.invalid',
            email: 'new@example.invalid',
            firstName: 'New',
            lastName: 'Person',
            teamId: 'new-team',
            departmentId: 'new-dept',
          },
        ],
        availability: [{ userGuid: 'new-user', date: '2026-08-10' }],
      },
      organization: { summary: () => ({ name: 'Saved company' }) },
      profiles: {
        read: () => ({
          gender: 'unspecified',
          married: false,
          dependentChildren: 0,
          soleCare: false,
          membership: {
            balance: {
              customAllocation: 25,
              used: 18,
              pending: 0,
              periodStart: '2026-01-01',
              periodEnd: '2026-12-31',
            },
          },
        }),
      },
    };
    return {
      api,
      actor: actor!,
      model: createWorkspaceReadModel(api as unknown as WorkspaceApiService),
      logout: () => {
        actor = null;
        api.workspace = null!;
      },
    };
  }

  it('supports an unfamiliar company and shows only stored away dates without private details', () => {
    const { api, model, actor } = setup();
    expect(model.people.map((p) => p.id)).toEqual(['new-user']);
    expect(model.company.name).toBe('Saved company');
    expect(model.allowedTeams(actor).map((t) => t.id)).toEqual(['new-team']);
    const away = model.availabilityFor(actor, 'team');
    expect(away.map((d) => d.start)).toEqual(['2026-08-10']);
    expect(away[0].type).toBeUndefined();
    expect(away[0].status).toBeUndefined();
    expect(model.ownEntries(actor)).toEqual([]);
    expect(Object.keys(model.balancesFor(actor)!)).toEqual(['annual']);
    api.workspace.availability = [];
    expect(model.availabilityFor(actor, 'team')).toEqual([]);
  });

  it('rejects foreign or stale membership contexts and clears data after logout', () => {
    const { model, actor, logout } = setup();
    expect(model.peopleFor({ ...actor, companyId: 'foreign' }, 'org')).toEqual([]);
    expect(model.balancesFor({ ...actor, companyId: 'foreign' })).toBeNull();
    expect(model.peopleFor({ ...actor, teamId: 'former-team' }, 'team')).toEqual([]);
    logout();
    expect(model.people).toEqual([]);
    expect(model.allowedScopes(actor)).toEqual([]);
    expect(model.availabilityFor(actor, 'org')).toEqual([]);
  });
});

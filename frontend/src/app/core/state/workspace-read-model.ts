import { Fixtures, Group, Person } from '../models/workspace.models';
import { WorkspaceApiService } from './workspace-api.service';

// A live projection of authorized API reads. There is no sample-data fallback.
export function createWorkspaceReadModel(api: WorkspaceApiService): Fixtures {
  const current = (person: Person | null): person is Person => {
    const actor = api.currentUser();
    return (
      !!actor &&
      !!person &&
      actor.id === person.id &&
      actor.companyId === person.companyId &&
      actor.teamId === person.teamId &&
      actor.departmentId === person.departmentId &&
      actor.capability === person.capability
    );
  };
  const people = (): Person[] =>
    (api.workspace?.people || [])
      .filter((p) => !!p.guid)
      .map((p) => ({
        id: p.guid!,
        personId: p.guid!,
        companyId: api.workspace!.companyId,
        name: [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' '),
        title: p.jobTitle || '',
        teamId: p.teamId || '',
        departmentId: p.departmentId || '',
        team: p.teamName || '',
        capability: p.systemRole === 'admin' ? 'admin' : 'employee',
        role: p.systemRole === 'admin' ? 'Admin' : 'Employee',
        initials: `${p.firstName[0] || ''}${p.lastName[0] || ''}`.toUpperCase(),
        username: p.username,
        email: p.email,
      }));
  const teams = (): Group[] =>
    (api.workspace?.teams || []).map((t) => ({
      id: t.guid,
      companyId: api.workspace!.companyId,
      name: t.name,
      departmentId: t.departmentId || undefined,
    }));
  const departments = (): Group[] =>
    (api.workspace?.departments || []).map((d) => ({
      id: d.guid,
      companyId: api.workspace!.companyId,
      name: d.name,
    }));
  const allowedTeams = (person: Person): Group[] =>
    !current(person)
      ? []
      : teams().filter(
          (t) =>
            person.capability === 'admin' ||
            (person.capability === 'lead'
              ? t.departmentId === person.departmentId
              : t.id === person.teamId),
        );
  const allowedDepartments = (person: Person): Group[] =>
    !current(person)
      ? []
      : departments().filter(
          (d) =>
            person.capability === 'admin' ||
            (person.capability === 'lead' && d.id === person.departmentId),
        );
  const allowedScopes = (person: Person | null): string[] =>
    !current(person)
      ? []
      : [
          'self',
          ...(person.teamId ? ['team'] : []),
          ...(person.capability !== 'employee' && person.departmentId ? ['department'] : []),
          'org',
        ];
  const peopleFor = (person: Person, scope: string, group?: string | null): Person[] => {
    if (!current(person) || !allowedScopes(person).includes(scope)) return [];
    if (scope === 'self') return group && group !== person.id ? [] : [person];
    if (scope === 'org') return group && group !== person.companyId ? [] : people();
    const id = group || (scope === 'team' ? person.teamId : person.departmentId);
    const groups = scope === 'team' ? allowedTeams(person) : allowedDepartments(person);
    return groups.some((g) => g.id === id)
      ? people().filter((p) => (scope === 'team' ? p.teamId : p.departmentId) === id)
      : [];
  };
  return {
    get company() {
      return {
        id: api.workspace?.companyId || '',
        name: api.organization.summary()?.name || '',
        countryCode: api.workspace?.countryCode || '',
      };
    },
    get people() {
      return people();
    },
    get teams() {
      return teams();
    },
    get departments() {
      return departments();
    },
    get entries() {
      return [];
    },
    person: (id) => people().find((p) => p.id === id),
    allowedScopes,
    allowedTeams,
    allowedDepartments,
    peopleFor,
    ownEntries: () => [],
    availabilityFor: (person, scope, group) => {
      const ids = new Set(peopleFor(person, scope, group).map((p) => p.id));
      return (api.workspace?.availability || [])
        .filter((d) => ids.has(d.userGuid))
        .map((d) => ({
          id: `availability:${d.userGuid}:${d.date}`,
          person: d.userGuid,
          companyId: person.companyId,
          start: d.date,
          end: d.date,
        }));
    },
    balancesFor: (person) => {
      const b = current(person) ? api.profiles.read()?.membership?.balance : null;
      const allocation = b?.customAllocation ?? b?.allocation;
      return b && allocation != null
        ? {
            annual: {
              allocation,
              used: b.used,
              pending: b.pending,
              period: `${b.periodStart} – ${b.periodEnd}`,
              note: 'Saved annual balance',
            },
          }
        : null;
    },
    eligibilityProfileFor: (person) => {
      const p = current(person) ? api.profiles.read() : null;
      return p
        ? {
            gender: p.gender,
            married: p.married,
            maritalStatus: p.married ? 'married' : 'unspecified',
            hasDependentChildren: p.dependentChildren > 0,
            soleCare: p.soleCare,
          }
        : null;
    },
  };
}

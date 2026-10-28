// Public fictional in-memory organization administration. Real authorization belongs on the server.
export function createOrganization(environment) {
  const fixtures = environment.VacateFixtures;
  let name = fixtures.company.name;
  let workWeekDays = 5;
  const departmentNames = new Map(),
    teamNames = new Map();
  function person() {
    const current = environment.VacateSession.currentUser();
    return current && fixtures.balancesFor(current) ? fixtures.person(current.id) : null;
  }
  function admin(companyId, actorId) {
    const current = person();
    return (
      current?.capability === 'admin' &&
      current.companyId === companyId &&
      companyId === fixtures.company.id &&
      (actorId === undefined || current.id === actorId)
    );
  }
  function summary() {
    return person() ? { name, workWeekDays } : null;
  }
  function groupName(kind, id) {
    const current = person();
    if (!current) return null;
    const groups =
      kind === 'department' ? fixtures.departments : kind === 'team' ? fixtures.teams : [];
    const group = groups.find((item) => item.id === id && item.companyId === current.companyId);
    if (!group) return null;
    const allowed =
      current.capability === 'admin' ||
      (kind === 'department'
        ? current.departmentId === id ||
          fixtures.allowedDepartments(current).some((item) => item.id === id)
        : fixtures.allowedTeams(current).some((item) => item.id === id));
    if (!allowed) return null;
    return (kind === 'department' ? departmentNames : teamNames).get(id) || group.name;
  }
  function read(companyId) {
    if (!admin(companyId)) return null;
    const member = (item) => ({
      id: item.id,
      name: item.name,
      jobTitle: item.title,
      systemRole: item.capability === 'admin' ? 'Admin' : 'Employee',
    });
    return {
      companyId,
      name,
      workWeekDays,
      departments: fixtures.departments
        .filter((item) => item.companyId === companyId)
        .map((item) => ({ id: item.id, name: groupName('department', item.id) })),
      teams: fixtures.teams
        .filter((item) => item.companyId === companyId)
        .map((item) => ({
          id: item.id,
          name: groupName('team', item.id),
          departmentId: item.departmentId || null,
          members: fixtures.people
            .filter((person) => person.companyId === companyId && person.teamId === item.id)
            .map(member),
        })),
      members: fixtures.people.filter((item) => item.companyId === companyId).map(member),
    };
  }
  function update(companyId, actorId, patch) {
    if (!admin(companyId, actorId))
      return {
        ok: false,
        error:
          'Organization administration is only available to an admin of this company. Reopen the page if your account changed.',
      };
    if (
      !patch ||
      typeof patch !== 'object' ||
      Array.isArray(patch) ||
      Object.keys(patch).some((key) => !['name', 'workWeekDays'].includes(key))
    )
      return { ok: false, error: 'Only company name and working days can be changed here.' };
    const candidate = { ...{ name, workWeekDays }, ...patch };
    if (typeof candidate.name !== 'string' || !candidate.name.trim())
      return { ok: false, error: 'Enter an organization name.' };
    if (![5, 6].includes(candidate.workWeekDays))
      return { ok: false, error: 'Choose five or six working days.' };
    name = candidate.name.trim();
    workWeekDays = candidate.workWeekDays;
    return { ok: true };
  }
  function rename(companyId, actorId, kind, id, value) {
    if (!admin(companyId, actorId))
      return { ok: false, error: 'Only a company admin can rename departments and teams.' };
    const group = (
      kind === 'department' ? fixtures.departments : kind === 'team' ? fixtures.teams : []
    ).find((item) => item.id === id && item.companyId === companyId);
    if (!group)
      return { ok: false, error: 'This department or team is unavailable in your company.' };
    if (typeof value !== 'string' || !value.trim()) return { ok: false, error: 'Enter a name.' };
    (kind === 'department' ? departmentNames : teamNames).set(id, value.trim());
    return { ok: true };
  }
  function clear() {
    name = fixtures.company.name;
    workWeekDays = 5;
    departmentNames.clear();
    teamNames.clear();
  }
  return Object.freeze({ read, update, rename, summary, groupName, clear });
}

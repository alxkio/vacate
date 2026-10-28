// Fictional, memory-only self-profile adapter. Never server authorization or real personal data.
export function createProfiles(environment) {
  const fixtures = environment.VacateFixtures;
  const saved = new Map();
  const originalProfile = (person) => fixtures.eligibilityProfileFor(person);
  const keys = [
    'firstName',
    'middleName',
    'lastName',
    'gender',
    'married',
    'dependentChildren',
    'soleCare',
  ];
  // Authored fictional counts; a prior boolean does not imply a precise count.
  const stamp = {
    createdAt: '2026-10-22T00:00:00Z',
    updatedAt: '2026-10-22T00:00:00Z',
    deleteRequestedAt: null,
    deletedAt: null,
  };
  const childCounts = [2, 2, 0, 2, 1, 0, 0, 0, 0, 2, 1, 0];
  const guid = (value) => `20000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
  function current() {
    const person = environment.VacateSession.currentUser();
    return person && fixtures.balancesFor(person) ? fixtures.person(person.id) : null;
  }
  function initial(person) {
    const index = fixtures.people.findIndex((item) => item.id === person.id);
    const facts = originalProfile(person);
    const ledger = fixtures.balancesFor(person).annual;
    const base = {
      ...stamp,
      id: index + 1,
      guid: guid(index + 1),
      username: person.email,
      firstName: person.name,
      middleName: null,
      lastName: 'Example',
      gender: facts.gender,
      married: facts.maritalStatus === 'married',
      dependentChildren: childCounts[index],
      soleCare: facts.soleCare === true,
      status: 'active',
      membership: {
        ...stamp,
        id: index + 1,
        guid: guid(600 + index),
        companyId: guid(100),
        systemRoleId: guid(person.capability === 'admin' ? 101 : 102),
        jobRoleId: guid(200 + index),
        departmentId: guid(
          300 + fixtures.departments.findIndex((item) => item.id === person.departmentId),
        ),
        teamId: guid(400 + fixtures.teams.findIndex((item) => item.id === person.teamId)),
        managerUserId: null,
        hireDate: null,
        employmentEndDate: null,
        priorService: null,
        workScheduleId: guid(500),
        holidayCalendarId: null,
        leavePolicyId: null,
        balance: {
          leaveTypeId: 'annual',
          periodStart: '2026-01-01',
          periodEnd: '2026-12-31',
          unit: 'days',
          asOf: '2026-10-22',
          policyVersion: null,
          policyMinimum: null,
          customAllocation: ledger.allocation,
          allocation: null,
          used: ledger.used,
          pending: ledger.pending,
          available: null,
        },
      },
    };
    return base;
  }
  function read() {
    const person = current();
    return person ? structuredClone(saved.get(person.id) || initial(person)) : null;
  }
  function update(targetId, values) {
    const person = current();
    if (!person || person.id !== targetId)
      return { ok: false, error: 'Your account changed. Reopen settings before saving.' };
    if (
      !values ||
      typeof values !== 'object' ||
      Array.isArray(values) ||
      Object.keys(values).some((key) => !keys.includes(key))
    )
      return { ok: false, error: 'Only your profile fields can be updated here.' };
    const next = { ...read(), ...values };
    for (const field of ['firstName', 'lastName']) {
      if (typeof next[field] !== 'string' || !next[field].trim())
        return { ok: false, error: 'Enter your first and last name.' };
      next[field] = next[field].trim();
    }
    if (next.middleName !== null && typeof next.middleName !== 'string')
      return { ok: false, error: 'Enter a valid middle name.' };
    next.middleName = next.middleName?.trim() || null;
    if (!['woman', 'man', 'unspecified'].includes(next.gender))
      return { ok: false, error: 'Choose a gender option.' };
    for (const field of ['married', 'soleCare']) {
      next[field] ??= false;
      if (typeof next[field] !== 'boolean')
        return { ok: false, error: 'Choose a valid family status.' };
    }
    next.dependentChildren ??= 0;
    if (!Number.isInteger(next.dependentChildren) || next.dependentChildren < 0)
      return { ok: false, error: 'Dependent children must be a whole number of zero or more.' };
    if (next.married && next.soleCare)
      return { ok: false, error: 'Married and sole care cannot both be selected.' };
    saved.set(person.id, structuredClone(next));
    return { ok: true };
  }
  function eligibilityProfileFor(person) {
    const base = originalProfile(person);
    const owner = current();
    if (!base || !owner || owner.id !== person.id || !saved.has(person.id)) return base;
    const own = saved.get(person.id);
    return {
      ...base,
      gender: own.gender,
      married: own.married,
      // Preserve known original marital context only when this fact has not changed.
      maritalStatus:
        own.married === (base.maritalStatus === 'married') ? base.maritalStatus : 'unspecified',
      hasDependentChildren: own.dependentChildren > 0,
      soleCare: own.soleCare,
    };
  }
  return Object.freeze({ read, update, clear: () => saved.clear(), eligibilityProfileFor });
}

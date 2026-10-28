// Same in-memory factory as Angular; synthetic permission checks do not prove server isolation.
import assert from 'node:assert/strict';
import { createFixtures } from './src/app/core/reference-data/fixtures.js';
import { createOrganization } from './testing/fixtures/organization.js';
const fixtures = createFixtures();
let actor = null;
const environment = { VacateFixtures: fixtures, VacateSession: { currentUser: () => actor } };
const organization = createOrganization(environment);
assert.equal(organization.read('northstar'), null);
for (const person of fixtures.people) {
  actor = person;
  const snapshot = organization.read('northstar');
  assert.equal(!!snapshot, person.capability === 'admin', person.id + ' browsing');
  if (person.capability !== 'admin') {
    assert.equal(
      organization.update('northstar', person.id, { name: 'Denied', workWeekDays: 6 }).ok,
      false,
    );
    assert.equal(
      organization.rename('northstar', person.id, 'team', 'platform', 'Denied').ok,
      false,
    );
  }
}
actor = fixtures.person('nora');
const before = organization.read('northstar'),
  ledger = structuredClone(fixtures.balancesFor(actor));
assert.equal(before.departments.length, 2);
assert.equal(before.teams.length, 4);
assert.equal(before.members.length, 12);
for (const patch of [
  { name: ' ', workWeekDays: 6 },
  { name: 'Partial', workWeekDays: 7 },
  { workWeekDays: '6' },
  { name: 'Valid', companyId: 'foreign' },
  { members: [] },
  null,
]) {
  assert.equal(organization.update('northstar', 'nora', patch).ok, false);
  assert.deepEqual(organization.read('northstar'), before, 'Failed changes must be atomic');
}
assert.equal(organization.update('foreign', 'nora', { name: 'Foreign' }).ok, false);
assert.equal(organization.read('foreign'), null);
assert.equal(organization.update('northstar', 'daria', { name: 'Stale' }).ok, false);
assert.equal(
  organization.update('northstar', 'nora', { name: ' Northstar Studio ', workWeekDays: 6 }).ok,
  true,
);
assert.equal(organization.summary().name, 'Northstar Studio');
assert.equal(organization.summary().workWeekDays, 6);
assert.equal(
  organization.rename('northstar', 'nora', 'department', 'technology', ' Engineering ').ok,
  true,
);
assert.equal(
  organization.rename('northstar', 'nora', 'team', 'platform', 'Core Platform').ok,
  true,
);
assert.equal(organization.groupName('department', 'technology'), 'Engineering');
assert.equal(organization.groupName('team', 'platform'), 'Core Platform');
for (const args of [
  ['team', 'unknown', 'Name'],
  ['company', 'northstar', 'Name'],
  ['team', 'platform', ' '],
])
  assert.equal(organization.rename('northstar', 'nora', ...args).ok, false);
const copy = organization.read('northstar');
copy.teams[0].members[0].name = 'Tampered';
assert.notEqual(organization.read('northstar').teams[0].members[0].name, 'Tampered');
assert.deepEqual(
  fixtures.balancesFor(actor),
  ledger,
  'Company settings cannot recalculate leave ledgers',
);
for (const team of organization.read('northstar').teams)
  for (const member of team.members)
    assert.deepEqual(Object.keys(member).sort(), ['id', 'jobTitle', 'name', 'systemRole']);
actor = { ...fixtures.person('maya'), capability: 'admin' };
assert.equal(organization.read('northstar'), null);
actor = { ...fixtures.person('nora'), companyId: 'foreign' };
assert.equal(organization.read('northstar'), null);
assert.equal(organization.update('northstar', 'nora', { name: 'Denied' }).ok, false);
actor = fixtures.person('nora');
organization.clear();
assert.deepEqual(organization.read('northstar'), before);
// Internal structure is optional: flat membership, independent departments, direct teams.
const flat = {
  ...fixtures,
  departments: [],
  teams: [],
  people: fixtures.people.map((person) => ({ ...person, departmentId: null, teamId: null })),
};
const flatEnv = { VacateFixtures: flat, VacateSession: { currentUser: () => actor } };
const flatStore = createOrganization(flatEnv);
assert.deepEqual(flatStore.read('northstar').departments, []);
assert.deepEqual(flatStore.read('northstar').teams, []);
assert.equal(flatStore.read('northstar').members.length, 12);
const direct = {
  ...flat,
  teams: [{ id: 'direct-team', name: 'Direct team', companyId: 'northstar', departmentId: null }],
  people: flat.people.map((person) => ({ ...person, teamId: 'direct-team' })),
};
const directStore = createOrganization({
  VacateFixtures: direct,
  VacateSession: { currentUser: () => actor },
});
assert.equal(directStore.read('northstar').teams[0].departmentId, null);
assert.equal(directStore.read('northstar').teams[0].members.length, 12);
assert.equal(
  directStore.rename('northstar', 'nora', 'team', 'direct-team', 'Standalone inside company').ok,
  true,
);
const foreign = {
  ...fixtures,
  teams: [
    ...fixtures.teams,
    { id: 'foreign-team', companyId: 'foreign', departmentId: null, name: 'Hidden' },
  ],
};
const scoped = createOrganization({
  VacateFixtures: foreign,
  VacateSession: { currentUser: () => actor },
});
assert.equal(
  scoped.read('northstar').teams.some((team) => team.id === 'foreign-team'),
  false,
);
assert.equal(scoped.rename('northstar', 'nora', 'team', 'foreign-team', 'Denied').ok, false);
console.log(
  'PASS: admin-only organization read/write, allowlisted atomic changes, five/six days, department/team renames, stale/forged/foreign contexts, detached projections, unchanged ledgers, reset, flat organizations and direct teams.',
);

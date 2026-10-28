// Contract and authorization-boundary checks against the same factory imported by Angular.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createFixtures } from './src/app/core/reference-data/fixtures.js';
import { createProfiles } from './testing/fixtures/profiles.js';
import { createCatalogue } from './src/app/core/reference-data/catalogue.js';
import { createEligibility } from './src/app/core/reference-data/eligibility.js';
const require = createRequire(import.meta.url),
  Ajv = require('ajv/dist/2020.js');
const ajv = new Ajv({ strict: true, allErrors: true });
require('ajv-formats')(ajv);
const validate = ajv.compile(
  JSON.parse(await readFile(new URL('../docs/contracts/user.schema.json', import.meta.url))),
);
const fixtures = createFixtures();
let actor = null;
const environment = { VacateFixtures: fixtures, VacateSession: { currentUser: () => actor } };
const profiles = createProfiles(environment);
environment.VacateFixtures = { ...fixtures, eligibilityProfileFor: profiles.eligibilityProfileFor };
environment.VacateLeave = createCatalogue(environment);
const eligibility = createEligibility(environment);
assert.equal(profiles.read(), null);
assert.equal(profiles.update('maya', { firstName: 'Unauthorized' }).ok, false);
for (const person of fixtures.people) {
  actor = person;
  const profile = profiles.read();
  assert.ok(validate(profile), JSON.stringify(validate.errors));
  assert.equal(profile.username, person.email);
  assert.equal(
    profile.membership.balance.customAllocation,
    fixtures.balancesFor(person).annual.allocation,
  );
}
actor = fixtures.person('maya');
const before = profiles.read();
for (const patch of [
  { firstName: 'Valid', membership: {} },
  { id: 9 },
  { username: 'other@example.invalid' },
  { status: 'active' },
  { gender: 'invalid' },
  { dependentChildren: -1 },
  { dependentChildren: 1.5 },
  { dependentChildren: '2' },
  { married: true, soleCare: true },
  { firstName: '  ' },
]) {
  assert.equal(profiles.update('maya', patch).ok, false, JSON.stringify(patch));
  assert.deepEqual(profiles.read(), before, 'Rejected mutation must be atomic');
}
assert.equal(profiles.update('nora', { firstName: 'Other' }).ok, false);
assert.equal(
  profiles.update('maya', {
    firstName: ' Maya edited ',
    middleName: ' Test ',
    lastName: ' Example ',
    gender: 'man',
    married: false,
    dependentChildren: 0,
    soleCare: false,
  }).ok,
  true,
);
assert.equal(profiles.read().firstName, 'Maya edited');
assert.ok(validate(profiles.read()), JSON.stringify(validate.errors));
assert.equal(eligibility.decisionFor('marriage').status, 'eligible');
assert.equal(eligibility.decisionFor('maternity').status, 'not-eligible');
assert.equal(eligibility.decisionFor('childcare').status, 'not-eligible');
assert.deepEqual(
  profiles.read().membership,
  before.membership,
  'Profile changes cannot mutate membership or allocation',
);
assert.equal(
  fixtures.people.some((person) => 'dependentChildren' in person || 'married' in person),
  false,
  'No private facts in shared people projection',
);
const copy = profiles.read();
copy.membership.systemRoleId = 'tampered';
assert.deepEqual(profiles.read().membership, before.membership, 'Read must be detached');
actor = fixtures.person('nora');
assert.equal(profiles.read().firstName, 'Nora');
assert.equal(profiles.update('maya', { firstName: 'stale' }).ok, false);
actor = { ...fixtures.person('maya'), companyId: 'foreign-company' };
assert.equal(profiles.read(), null);
assert.equal(profiles.update('maya', { firstName: 'foreign' }).ok, false);
actor = fixtures.person('maya');
assert.equal(
  profiles.update('maya', { married: null, dependentChildren: null, soleCare: null }).ok,
  true,
);
assert.equal(profiles.read().dependentChildren, 0);
assert.equal(profiles.update('maya', { dependentChildren: 2, soleCare: true }).ok, true);
assert.equal(
  eligibility.decisionFor('single-parent').status,
  'to-confirm',
  'Do not infer divorce from married false',
);
profiles.clear();
assert.deepEqual(profiles.read(), before, 'Sign-out/reload reset helper');
console.log(
  'PASS: all 12 own-profile snapshots match schema; allowlist, atomic rejection, stale/cross-account/company guards, defaults, detached reads, privacy, eligibility refresh, unchanged membership and reset.',
);

// Check storage identities separately from public API projections; both use the same domain facts.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Ajv = require('ajv/dist/2020');
const formats = require('ajv-formats');
const schema = JSON.parse(
  await readFile(new URL('../docs/contracts/user.schema.json', import.meta.url)),
);
const seed = JSON.parse(
  await readFile(new URL('../api/testing/fixtures/fictional-users.json', import.meta.url)),
);
const ajv = new Ajv({ strict: false, allErrors: true });
formats(ajv);
const validate = ajv.compile(schema);
for (const name of ['user.example.json', 'user-unassigned.example.json']) {
  const value = JSON.parse(await readFile(new URL(`../docs/contracts/${name}`, import.meta.url)));
  assert.ok(validate(value), JSON.stringify(validate.errors));
}
const identity = (records) => {
  assert.equal(new Set(records.map((x) => x.id)).size, records.length);
  assert.equal(new Set(records.map((x) => x.guid)).size, records.length);
  for (const record of records) {
    assert.ok(Number.isInteger(record.id) && record.id > 0);
    assert.match(record.guid, /^[0-9a-f-]{36}$/i);
  }
};
identity(seed.users.map((u) => u.profile));
identity(seed.organizations);
identity(seed.users.map((u) => u.profile.membership));
identity(seed.organizations.flatMap((o) => o.departments));
identity(seed.organizations.flatMap((o) => o.teams));
identity(seed.systemRoles);
identity(seed.jobRoles);
identity(seed.workSchedules);
assert.equal(seed.users.length, 12);
assert.equal(new Set(seed.users.map((u) => u.profile.username)).size, 12);
for (const user of seed.users) {
  const m = user.profile.membership,
    org = seed.organizations.find((o) => o.id === m.companyId);
  assert.ok(org);
  assert.ok(m.departmentId === null || org.departments.some((x) => x.id === m.departmentId));
  assert.ok(m.teamId === null || org.teams.some((x) => x.id === m.teamId));
  assert.ok(seed.systemRoles.some((x) => x.id === m.systemRoleId));
  assert.ok(seed.jobRoles.some((x) => x.id === m.jobRoleId && x.companyId === org.id));
  assert.ok(m.workScheduleId === null || seed.workSchedules.some((x) => x.id === m.workScheduleId));
}
console.log(
  'PASS: separate numeric Id/Guid identities and numeric storage references; public examples satisfy the user/membership schema.',
);
if (process.env.API_CONTRACT_URL) {
  const base = process.env.API_CONTRACT_URL.replace(/\/$/, '');
  for (const user of seed.users) {
    const login = await fetch(`${base}/auth/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.alias, password: user.alias }),
    });
    assert.equal(login.status, 200);
    const { accessToken } = await login.json();
    const headers = { Authorization: `Bearer ${accessToken}` };
    const current = await fetch(`${base}/auth/sessions/current`, { headers });
    assert.equal(current.status, 200);
    const { profile } = await current.json();
    assert.ok(validate(profile), JSON.stringify(validate.errors));
    assert.equal(profile.id, user.profile.id);
    assert.equal(profile.guid, user.profile.guid);
    assert.equal(
      (await fetch(`${base}/auth/sessions/current`, { method: 'DELETE', headers })).status,
      204,
    );
  }
  console.log(
    'PASS: all twelve real HTTP account/membership projections satisfy the shared JSON Schema.',
  );
}

import { environment } from './verify-environment.mjs';
// Uses the AJV validator already locked with the Angular tooling (run npm ci in frontend).
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(new URL('./package.json',import.meta.url));
const Ajv2020=require('ajv/dist/2020.js');
const addFormats=require('ajv-formats');
const ajv=new Ajv2020({allErrors:true,strict:true});addFormats(ajv);
const schema=JSON.parse(await readFile(new URL('../docs/contracts/leave-eligibility.schema.json',import.meta.url),'utf8'));
const validate=ajv.compile(schema);
const {context}=environment();
let current=null;context.VacateDemo={currentUser:()=>current};
for(const person of context.VacateFixtures.people){
  current=person;
  const response=JSON.parse(JSON.stringify(context.VacateEligibility.getResponse()));
  assert.ok(validate(response),JSON.stringify(validate.errors));
  assert.equal(response.employeeId,person.id);assert.equal(response.companyId,person.companyId);
  assert.equal(response.decisions.length,30);assert.equal(new Set(response.decisions.map(item=>item.typeId)).size,30);
  const invalid=structuredClone(response);invalid.decisions[0].status='unknown-allowed';
  assert.equal(validate(invalid),false,'Schema accepted unsupported status');
  const leak=structuredClone(response);leak.decisions[0].diagnosis='private';
  assert.equal(validate(leak),false,'Schema accepted raw medical details');
}
console.log('PASS: proposed eligibility JSON Schema2020-12; all12 own responses /360 decisions; invalid status and raw medical fields rejected.');

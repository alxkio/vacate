// VAC-6 synthetic fixture/session acceptance. This is presentation logic, not server security.
// Node.js 22+, no dependencies. Expected roster is independent of the fixture implementation.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const dist = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const expected = [
  ['leah','Platform','Technology','lead'], ['ravi','Platform','Technology','employee'], ['noah','Platform','Technology','employee'],
  ['maya','Applications','Technology','employee'], ['theo','Applications','Technology','employee'], ['iris','Applications','Technology','employee'],
  ['ella','Product','Business','lead'], ['owen','Product','Business','employee'], ['zoe','Product','Business','employee'],
  ['daria','Operations','Business','admin'], ['nora','Operations','Business','admin'], ['sam','Operations','Business','employee'],
];
const expectedAnnual={leah:[20,3,0],ravi:[21,4,0],noah:[22,5,0],maya:[25,8,3],theo:[24,7,0],iris:[25,3,0],ella:[26,4,0],owen:[20,5,0],zoe:[21,6,0],daria:[22,7,0],nora:[23,1,2],sam:[24,4,0]};
const source = Object.fromEntries(await Promise.all(['leave-types.js','demo-fixtures.js','demo-session.js'].map(async name=>[name,await readFile(join(dist,name),'utf8')])));
function environment(page='login', values={}) {
  const store = new Map(Object.entries(values)), redirects=[];
  const context=vm.createContext({window:{},document:{documentElement:{dataset:{demoPage:page}}},sessionStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)},addEventListener:()=>{},location:{href:'https://mock.example.invalid/'+(page==='login'?'login.html':'index.html'),replace:value=>redirects.push(value)},URL,console});
  context.window=context;
  for(const name of ['leave-types.js','demo-fixtures.js','demo-session.js'])vm.runInContext(source[name],context,{filename:name});
  return {context, store, redirects, fixtures:context.VacateFixtures, session:context.VacateDemo};
}
const plain=value=>JSON.parse(JSON.stringify(value));
const ids=values=>plain(values.map(person=>person.id)).sort();
const {fixtures:f,session:s,store}=environment();
assert.equal(f.people.length,12); assert.equal(new Set(f.people.map(person=>person.id)).size,12);
assert.equal(new Set(f.people.map(person=>person.username||person.email)).size,12);
assert.equal(f.teams.length,4);assert.equal(f.departments.length,2);
assert.equal(f.person('unknown'),undefined);
assert.equal(s.currentUser(),null);
for(const [id,team,department,role] of expected) {
  const person=f.person(id);assert.ok(person,`${id} missing`);
  assert.equal(person.username,id); assert.equal(person.email,`${id}@example.invalid`);
  assert.equal(person.capability||person.role,role,`${id} capability`);
  assert.equal(f.teams.find(group=>group.id===person.teamId)?.name,team);
  assert.equal(f.departments.find(group=>group.id===person.departmentId)?.name,department);
  assert.equal(s.login(id,'wrong'),false);
  assert.equal(s.login(id,id),true);
  assert.equal(s.currentUser().id||s.currentUser().personId,id);
  assert.equal(store.get('vacate.demo.account.v2'),id);
  assert.deepEqual([...store.keys()],['vacate.demo.account.v2'],'Only the person ID belongs in session storage');
  assert.deepEqual(plain(f.allowedScopes(person)),role==='admin'?['self','team','department','org']:role==='lead'?['self','team','department']:['self','team']);
  assert.deepEqual(ids(f.peopleFor(person,'self')),[id]);
  const teamIds=expected.filter(row=>row[1]===team).map(row=>row[0]).sort();
  assert.deepEqual(ids(f.peopleFor(person,'team',person.teamId)),teamIds);
  const departmentIds=expected.filter(row=>row[2]===department).map(row=>row[0]).sort();
  assert.deepEqual(ids(f.peopleFor(person,'department',person.departmentId)),role==='employee'?[]:departmentIds);
  assert.deepEqual(ids(f.peopleFor(person,'org')),role==='admin'?expected.map(row=>row[0]).sort():[]);
  assert.deepEqual(ids(f.peopleFor(person,'team','foreign-team')),[]);
  assert.deepEqual(ids(f.peopleFor(person,'department','foreign-department')),[]);
  assert.deepEqual(ids(f.peopleFor(person,'company','foreign-company')),[]);
  assert.deepEqual(ids(f.peopleFor(person,'org','foreign-company')),[]);
  assert.deepEqual(ids(f.peopleFor(person,'self','unknown-person')),[]);
  for(const other of f.teams.filter(group=>!f.allowedTeams(person).some(allowed=>allowed.id===group.id)))assert.deepEqual(ids(f.peopleFor(person,'team',other.id)),[],`${id} accessed forbidden team ${other.id}`);
  for(const other of f.departments.filter(group=>!f.allowedDepartments(person).some(allowed=>allowed.id===group.id)))assert.deepEqual(ids(f.peopleFor(person,'department',other.id)),[],`${id} accessed forbidden department ${other.id}`);
  for(const scope of f.allowedScopes(person).filter(scope=>scope!=='self')) {
    const members=ids(f.peopleFor(person,scope));
    for(const entry of f.availabilityFor(person,scope)) {
      assert.ok(members.includes(entry.person||entry.personId),`${id}/${scope} includes outsider`);
      for(const field of ['type','status','title','reason','balance','comment','comments','medical'])assert.equal(Object.hasOwn(entry,field),false,`Shared ${field} leaked for ${id}`);
    }
  }
  const own=f.ownEntries(person);assert.ok(own.every(entry=>(entry.person||entry.personId)===id));
  assert.ok(own.every(entry=>entry.type&&entry.status),'Own details missing');
  assert.ok(Object.hasOwn(f.balancesFor(person),'annual'),`${id} lacks own annual allocation`);
  const annual=f.balancesFor(person).annual;
  assert.deepEqual([annual.allocation,annual.used,annual.pending],expectedAnnual[id],`${id} annual fixture changed`);
  assert.equal(environment('calendar',{'vacate.demo.account.v2':id}).context.VacateLeave.balanceOf('annual').available,annual.allocation-annual.used-annual.pending,`${id} active balance binding`);
  for(const [type,balance] of Object.entries(f.balancesFor(person))) {
    for(const key of ['allocation','used','pending'])assert.ok(Number.isFinite(balance[key])&&balance[key]>=0,`${id}/${type}/${key}`);
    assert.ok(balance.used+balance.pending<=balance.allocation,`${id}/${type} fixture exceeds allocation`);
    const totals=status=>own.filter(entry=>entry.type===type&&entry.status===status).reduce((sum,entry)=>sum+entry.amount,0);
    assert.equal(totals('Approved'),balance.used,`${id}/${type} approved ledger does not reconcile`);
    assert.equal(totals('Pending'),balance.pending,`${id}/${type} pending ledger does not reconcile`);
  }
}
assert.equal(s.login('user','user'),true);assert.equal(s.currentUser().id||s.currentUser().personId,'maya');
assert.equal(s.login('admin','admin'),true);assert.equal(s.currentUser().id||s.currentUser().personId,'nora');
assert.equal(s.login('user','admin'),false);assert.equal(s.login('unknown@example.invalid','demo'),false);
assert.deepEqual(plain(f.ownEntries(f.person('sam')).filter(entry=>entry.end>='2026-10-22')),[],'Sam should have no upcoming requests');
for(const missing of [null,undefined,{id:'unknown'},{id:'maya',companyId:'foreign-company'}]) {
  assert.equal(f.balancesFor(missing),null,'Unknown identity acquired balances');
  assert.deepEqual(plain(f.ownEntries(missing)),[],'Unknown identity acquired requests');
  assert.deepEqual(plain(f.peopleFor(missing,'org')),[],'Unknown identity acquired company people');
  assert.deepEqual(plain(f.availabilityFor(missing,'team')),[],'Unknown identity acquired shared availability');
}
const zero=environment('calendar',{'vacate.demo.account.v2':'maya'});zero.context.VacateFixtures={...zero.fixtures,balancesFor:()=>({annual:{allocation:0,used:0,pending:0}})};
assert.equal(zero.context.VacateLeave.balanceOf('annual').available,0);assert.equal(zero.context.VacateLeave.balanceOf('annual').percentage,null,'Zero allocation produced a percentage');
assert.equal(environment().context.VacateLeave.balanceOf('annual'),null,'Signed-out session acquired global balances');
const stale=environment('calendar',{'vacate.demo.account.v1':'admin'});assert.equal(stale.session.currentUser(),null);assert.ok(stale.redirects.some(url=>url.endsWith('/login.html')));
const invalid=environment('calendar',{'vacate.demo.account.v2':'unknown'});assert.equal(invalid.session.currentUser(),null);assert.ok(invalid.redirects.some(url=>url.endsWith('/login.html')));
const valid=environment('login',{'vacate.demo.account.v2':'maya'});assert.ok(valid.redirects.some(url=>url.endsWith('/index.html')));valid.session.logout();assert.equal(valid.session.currentUser(),null);assert.equal(valid.store.get('vacate.demo.account.v2'),undefined);
console.log('PASS: independent 12-person roster; canonical/alias sessions; scope membership and negative IDs; sanitized shared projections; own request/balance ownership; empty Sam; stale/invalid session and logout. Synthetic presentation checks only.');

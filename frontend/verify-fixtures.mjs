// VAC-6 synthetic fixture/session acceptance. This is presentation logic, not server security.
// Node.js 22+, no dependencies. Expected roster is independent of the fixture implementation.
import assert from 'node:assert/strict';
import { environment } from './verify-environment.mjs';
const expected = [
  ['leah','Platform','Technology','lead'], ['ravi','Platform','Technology','employee'], ['noah','Platform','Technology','employee'],
  ['maya','Applications','Technology','employee'], ['theo','Applications','Technology','employee'], ['iris','Applications','Technology','employee'],
  ['ella','Product','Business','lead'], ['owen','Product','Business','employee'], ['zoe','Product','Business','employee'],
  ['daria','Operations','Business','admin'], ['nora','Operations','Business','admin'], ['sam','Operations','Business','employee'],
];
const expectedAnnual={leah:[20,3,0],ravi:[21,4,0],noah:[22,5,0],maya:[25,8,3],theo:[24,7,0],iris:[25,3,0],ella:[26,4,0],owen:[20,5,0],zoe:[21,6,0],daria:[22,7,0],nora:[23,1,2],sam:[24,4,0]};
const plain=value=>JSON.parse(JSON.stringify(value));
const catalogue=environment().context.VacateLeave;
assert.equal(catalogue.types.length,30);assert.equal(new Set(catalogue.types.map(type=>type.id)).size,30);
assert.equal(catalogue.types.filter(type=>type.shape!=='supplement').length,29);
assert.deepEqual(plain(catalogue.shortlistIds),['annual','sick','maternity','paternity','childcare','parental','school','dependent-illness','child-hospitalization','marriage','voting','study']);
assert.equal(catalogue.shortlistIds.includes('postgraduate'),false);
assert.equal(catalogue.typeLabel(catalogue.getType('dependent-illness')),'Child illness (dependent illness)');
assert.match(catalogue.getType('dependent-illness').requestScope,/children only/);
assert.equal(catalogue.getType('sick').shape,'variable');
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
  for(const field of ['gender','maritalStatus','hasDependentChildren','soleCare'])assert.equal(Object.hasOwn(person,field),false,`${field} leaked into shared person projection`);
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
      for(const field of ['type','status','title','reason','balance','comment','comments','medical','eligibility','gender','maritalStatus','hasDependentChildren','soleCare'])assert.equal(Object.hasOwn(entry,field),false,`Shared ${field} leaked for ${id}`);
    }
  }
  const own=f.ownEntries(person);assert.ok(own.every(entry=>(entry.person||entry.personId)===id));
  assert.ok(own.every(entry=>entry.type&&entry.status),'Own details missing');
  assert.ok(Object.hasOwn(f.balancesFor(person),'annual'),`${id} lacks own annual allocation`);
  const annual=f.balancesFor(person).annual;
  assert.deepEqual([annual.allocation,annual.used,annual.pending],expectedAnnual[id],`${id} annual fixture changed`);
  assert.equal(environment('calendar',{'vacate.demo.account.v2':id}).context.VacateLeave.balanceOf('annual').available,annual.allocation-annual.used-annual.pending,`${id} active balance binding`);
  assert.equal(environment('calendar',{'vacate.demo.account.v2':id}).context.VacateLeave.balanceOf('sick'),null,`${id} invented sick-leave quota`);
  const eligibility=environment('calendar',{'vacate.demo.account.v2':id}).context.VacateEligibility;
  const response=eligibility.getResponse();
  assert.equal(response.employeeId,id);assert.equal(response.companyId,'northstar');assert.equal(response.countryCode,'GR');
  assert.equal(response.decisions.length,30);assert.equal(new Set(response.decisions.map(item=>item.typeId)).size,30);
  assert.equal(eligibility.decisionFor('annual').status,'eligible');
  assert.equal(eligibility.decisionFor('sick').status,'to-confirm');
  assert.equal(eligibility.decisionFor('disability-supplement').status,'not-eligible');
  assert.equal(eligibility.decisionFor('unknown-type').status,'not-eligible');
  for(const decision of response.decisions){
    assert.ok(['eligible','not-eligible','to-confirm'].includes(decision.status));
    assert.equal(decision.policyVersion,response.policyVersion);assert.ok(catalogue.getType(decision.typeId));
    for(const field of ['gender','sex','maritalStatus','diagnosis','children','custody','medicalEvidence'])assert.equal(Object.hasOwn(decision,field),false,`Raw personal fact ${field} leaked`);
  }
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
const stale=environment('calendar',{'vacate.demo.account.v1':'admin'});assert.equal(stale.session.currentUser(),null);
const invalid=environment('calendar',{'vacate.demo.account.v2':'unknown'});assert.equal(invalid.session.currentUser(),null);
const valid=environment('login',{'vacate.demo.account.v2':'maya'});assert.equal(valid.session.currentUser().id,'maya');valid.session.logout();assert.equal(valid.session.currentUser(),null);assert.equal(valid.store.get('vacate.demo.account.v2'),undefined);
const eligibilityCase=id=>environment('calendar',{'vacate.demo.account.v2':id}).context.VacateEligibility;
assert.equal(eligibilityCase('maya').decisionFor('marriage').status,'not-eligible');
assert.equal(eligibilityCase('theo').decisionFor('marriage').status,'eligible');
assert.equal(eligibilityCase('nora').decisionFor('maternity').status,'eligible');
assert.equal(eligibilityCase('noah').decisionFor('maternity').status,'not-eligible');
assert.equal(eligibilityCase('noah').decisionFor('paternity').status,'eligible');
assert.equal(eligibilityCase('sam').decisionFor('school').status,'not-eligible');
assert.equal(eligibilityCase('nora').decisionFor('single-parent').status,'eligible');
assert.equal(eligibilityCase('theo').decisionFor('single-parent').status,'not-eligible');
assert.equal(eligibilityCase('maya').decisionFor('maternity').status,'eligible');
assert.equal(eligibilityCase('maya').decisionFor('paternity').status,'not-eligible');
assert.equal(eligibilityCase('ella').decisionFor('maternity').status,'to-confirm');
const switched=environment('calendar',{'vacate.demo.account.v2':'maya'});
assert.equal(switched.context.VacateEligibility.decisionFor('marriage').status,'not-eligible');
switched.store.set('vacate.demo.account.v2','theo');
assert.equal(switched.context.VacateEligibility.getResponse().employeeId,'theo');
assert.equal(switched.context.VacateEligibility.decisionFor('marriage').status,'eligible');
switched.store.clear();assert.equal(switched.context.VacateEligibility.getResponse(),null);
assert.equal(switched.context.VacateEligibility.decisionFor('annual').status,'not-eligible');
const foreign=environment('calendar',{'vacate.demo.account.v2':'maya'});
foreign.context.VacateDemo={currentUser:()=>({...foreign.fixtures.person('maya'),companyId:'foreign-company'})};
assert.equal(foreign.context.VacateEligibility.getResponse(),null,'Foreign-company identity acquired decisions');
for(const profile of [undefined,{}, {gender:'unspecified',maritalStatus:'unspecified'}, {maritalStatus:'divorced',hasDependentChildren:true}]){
  const missing=environment('calendar',{'vacate.demo.account.v2':'maya'});
  missing.context.VacateFixtures={...missing.fixtures,eligibilityProfileFor:()=>profile};
  assert.equal(missing.context.VacateEligibility.decisionFor('single-parent').status,'to-confirm','Missing profile facts became a denial/grant');
  if(!profile?.gender||profile.gender==='unspecified')assert.equal(missing.context.VacateEligibility.decisionFor('maternity').status,'to-confirm');
}
const unsupported=environment('calendar',{'vacate.demo.account.v2':'maya'});
unsupported.context.VacateFixtures={...unsupported.fixtures,company:{...unsupported.fixtures.company,countryCode:'ZZ'}};
assert.equal(unsupported.context.VacateEligibility.getResponse().countryCode,'ZZ');
for(const decision of unsupported.context.VacateEligibility.getResponse().decisions.filter(item=>item.typeId!=='disability-supplement'))assert.equal(decision.status,'to-confirm','Unsupported country inherited Greece rules');
console.log('PASS: independent12-person roster and own ledgers; sessions/scopes and negative IDs; sanitized shared projections; GR profile checks with3 eligibility states, missing facts and unsupported country; own/foreign eligibility context, stale/invalid session and logout. Synthetic presentation checks only.');

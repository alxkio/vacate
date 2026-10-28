'use strict';
// Public, fictional browser fixtures. Presentation checks are not server authorization.
export function createFixtures() {
  const company = Object.freeze({id:'northstar',name:'Northstar Example',sector:'Fictional IT services',countryCode:'GR'});
  const departments = [{id:'technology',companyId:company.id,name:'Technology'},{id:'business',companyId:company.id,name:'Business'}];
  const teams = [{id:'platform',departmentId:'technology',name:'Platform'},{id:'applications',departmentId:'technology',name:'Applications'},{id:'product',departmentId:'business',name:'Product'},{id:'operations',departmentId:'business',name:'Operations'}].map(team=>({...team,companyId:company.id}));
  const roster = [
    ['leah','Leah','Platform lead','platform','lead'],['ravi','Ravi','DevOps engineer','platform','employee'],['noah','Noah','Software engineer','platform','employee'],
    ['maya','Maya','Software engineer','applications','employee'],['theo','Theo','Software engineer','applications','employee'],['iris','Iris','QA engineer','applications','employee'],
    ['ella','Ella','Product lead','product','lead'],['owen','Owen','Product designer','product','employee'],['zoe','Zoe','Product specialist','product','employee'],
    ['daria','Daria','Owner','operations','admin'],['nora','Nora','HR / operations','operations','admin'],['sam','Sam','Operations coordinator','operations','employee'],
  ];
  const people = roster.map(([id,name,title,teamId,capability])=>Object.freeze({id,personId:id,companyId:company.id,name,title,teamId,departmentId:teams.find(team=>team.id===teamId).departmentId,team:teams.find(team=>team.id===teamId).name,capability,role:capability==='admin'?'Admin':capability==='lead'?'Team lead':'Employee',initials:name.slice(0,2).toUpperCase(),username:id,email:`${id}@example.invalid`}));
  const person = id => people.find(item=>item.id===id);
  // Explicit public fictional profile values; never inferred from names or job titles.
  const profileRows=[
    ['leah','woman','married',true,false],['ravi','man','married',true,false],['noah','man','married',false,false],
    ['maya','woman','married',true,false],['theo','man','divorced',true,false],['iris','woman','single',false,false],
    ['ella','unspecified','unspecified',null,null],['owen','man','single',false,false],['zoe','woman','single',false,false],
    ['daria','woman','married',true,false],['nora','woman','divorced',true,true],['sam','man','single',false,false],
  ];
  const eligibilityProfiles=Object.fromEntries(profileRows.map(([id,gender,maritalStatus,hasDependentChildren,soleCare])=>[id,Object.freeze({gender,maritalStatus,hasDependentChildren,soleCare})]));
  // Require canonical identity fields. A foreign company or mismatched group fails closed.
  const validPerson = candidate => candidate && people.find(item=>item.id===candidate.id&&item.companyId===candidate.companyId&&item.teamId===candidate.teamId&&item.departmentId===candidate.departmentId&&item.capability===candidate.capability);
  const allowedScopes = candidate => {const current=validPerson(candidate);return current?['self','team','department','org']:[];};
  const allowedTeams = candidate => {const current=validPerson(candidate);return current?teams.filter(team=>team.companyId===current.companyId&&(current.capability==='admin'||(current.capability==='lead'?team.departmentId===current.departmentId:team.id===current.teamId))):[];};
  const allowedDepartments = candidate => {const current=validPerson(candidate);return current?departments.filter(department=>department.companyId===current.companyId&&(current.capability==='admin'||(current.capability==='lead'&&department.id===current.departmentId))):[];};
  function peopleFor(candidate,scope,groupId) {
    const current=validPerson(candidate);if(!current||!allowedScopes(current).includes(scope))return [];
    if(scope==='self')return groupId&&groupId!==current.id?[]:[current];
    if(scope==='org')return groupId&&groupId!==current.companyId?[]:people.filter(item=>item.companyId===current.companyId);
    const allowed=scope==='team'?allowedTeams(current):allowedDepartments(current),id=groupId||(scope==='team'?current.teamId:current.departmentId);
    if(!allowed.some(group=>group.id===id))return [];
    return people.filter(item=>item.companyId===current.companyId&&item[scope==='team'?'teamId':'departmentId']===id);
  }
  const entries=[];
  const allocations={};
  const note='Configured fictional allocation; no eligibility or work-history calculation.';
  people.forEach((current,index)=>{
    const used=current.id==='maya'?8:current.id==='sam'?4:1+(index%5);
    entries.push({id:`${current.id}-summer`,person:current.id,companyId:company.id,start:'2026-07-13',end:`2026-07-${12+Math.min(used,5)}`,type:'annual',status:'Approved',title:'Summer leave',amount:Math.min(used,5),unit:'working days'});
    if(used>5)entries.push({id:`${current.id}-september`,person:current.id,companyId:company.id,start:'2026-09-09',end:`2026-09-${8+used-5}`,type:'annual',status:'Approved',title:'September leave',amount:used-5,unit:'working days'});
    const upcoming=current.id!=='sam';
    const pending=['maya','nora'].includes(current.id);
    const amount=current.id==='maya'?3:2;
    if(upcoming)entries.push({id:`${current.id}-oct`,person:current.id,companyId:company.id,start:'2026-10-26',end:current.id==='maya'?'2026-10-28':'2026-10-27',type:'annual',status:pending?'Pending':'Approved',title:'Autumn leave',amount,unit:'working days'});
    allocations[current.id]={annual:{allocation:current.id==='maya'?25:20+(index%7),used:used+(upcoming&&!pending?amount:0),pending:pending?amount:0,period:'2026',note}};
  });
  entries.push({id:'iris-study',person:'iris',companyId:company.id,start:'2026-11-05',end:'2026-11-06',type:'study',status:'Approved',title:'Study leave',amount:2,unit:'working days'});
  allocations.iris.study={allocation:30,used:2,pending:0,period:'2026',note};
  entries.push({id:'maya-carer',person:'maya',companyId:company.id,start:'2026-10-07',end:'2026-10-08',type:'carer',status:'Approved',title:'Carer leave',amount:2,unit:'working days'},{id:'maya-school',person:'maya',companyId:company.id,start:'2026-10-16',end:'2026-10-16',type:'school',status:'Approved',title:'School attendance',amount:1,unit:'working days'},{id:'maya-parental-used',person:'maya',companyId:company.id,start:'2026-08-01',end:'2026-08-31',type:'parental',status:'Approved',title:'Parental leave',amount:1,unit:'months'},{id:'maya-parental-pending',person:'maya',companyId:company.id,start:'2027-03-01',end:'2027-03-31',type:'parental',status:'Pending',title:'Parental leave',amount:1,unit:'months'});
  allocations.maya.carer={allocation:5,used:2,pending:0,period:'2026',note};
  allocations.maya.school={allocation:4,used:1,pending:0,period:'Demo child / 2026',note:'Illustrative shared-parent allowance; not four days per parent.'};
  allocations.maya.parental={allocation:4,used:1,pending:1,period:'Demo child / entitlement period',note:'Illustrative per-child allocation, not a yearly grant.'};
  entries.forEach(Object.freeze);Object.values(allocations).forEach(values=>{Object.values(values).forEach(Object.freeze);Object.freeze(values);});
  const ownEntries = candidate => {const current=validPerson(candidate);return current?entries.filter(entry=>entry.person===current.id&&entry.companyId===current.companyId):[];};
  const balancesFor = candidate => {const current=validPerson(candidate);return current?allocations[current.id]:null;};
  const eligibilityProfileFor = candidate => {const current=validPerson(candidate);return current?eligibilityProfiles[current.id]:null;};
  const availabilityFor = (candidate,scope,groupId) => {const ids=peopleFor(candidate,scope,groupId).map(item=>item.id);return entries.filter(entry=>entry.companyId===candidate?.companyId&&ids.includes(entry.person)).map(({id,person,companyId,start,end})=>({id,person,companyId,start,end}));};
  return Object.freeze({company,departments:Object.freeze(departments.map(Object.freeze)),teams:Object.freeze(teams.map(Object.freeze)),people:Object.freeze(people),entries:Object.freeze(entries),person,allowedScopes,allowedTeams,allowedDepartments,peopleFor,balancesFor,eligibilityProfileFor,ownEntries,availabilityFor});
}

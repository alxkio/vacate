'use strict';
// Provisional frontend profile checks, not a statutory evaluator. All profiles are fiction.
export function createEligibility(environment) {
  const policyVersion='GR-demo-profile-v1';
  // Shared by country, not company. Future company overrides are not active.
  const policies=Object.freeze({GR:Object.freeze({version:policyVersion,
    womenOnly:Object.freeze(['maternity','prenatal','assisted-reproduction','screening']),
    menOnly:Object.freeze(['paternity']),
    childContext:Object.freeze(['childcare','parental','school','dependent-illness','serious-child-illness','child-hospitalization','disabled-child']),
  })});
  const state=(status,reasonCode,reason)=>Object.freeze({status,reasonCode,reason,policyVersion});
  const eligible=state('eligible','profile-allows-application','Current mock profile allows applying; supporting details are checked later.');
  const unconfirmed=state('to-confirm','details-unconfirmed','Eligibility details have not been confirmed.');
  function profileDecision(type,profile,policy) {
    profile=profile||{};
    if(type.id==='marriage') {
      if(typeof profile.married==='boolean')return profile.married?state('not-eligible','married-profile','Marriage leave is unavailable to married employees under this mock profile rule.'):eligible;
      if(!['single','married','divorced','widowed'].includes(profile.maritalStatus))return unconfirmed;
      return profile.maritalStatus==='married'?state('not-eligible','married-profile','Marriage leave is unavailable to married employees under this mock profile rule.'):eligible;
    }
    if(policy.womenOnly.includes(type.id)||policy.menOnly.includes(type.id)) {
      if(!['woman','man'].includes(profile.gender))return unconfirmed;
      const expected=policy.womenOnly.includes(type.id)?'woman':'man';
      return profile.gender===expected?eligible:state('not-eligible','gender-profile-rule','Current profile does not meet this type’s mock gender rule.');
    }
    if(type.id==='single-parent') {
      const unavailable=state('not-eligible','single-parent-profile-rule','Single-parent leave is unavailable under the current mock profile settings.');
      if(profile.hasDependentChildren===false||profile.soleCare===false)return unavailable;
      if(!['single','married','divorced','widowed'].includes(profile.maritalStatus))return unconfirmed;
      if(profile.maritalStatus!=='divorced')return unavailable;
      return typeof profile.hasDependentChildren==='boolean'&&typeof profile.soleCare==='boolean'?eligible:unconfirmed;
    }
    if(policy.childContext.includes(type.id)) {
      if(typeof profile.hasDependentChildren!=='boolean')return unconfirmed;
      if(!profile.hasDependentChildren)return state('not-eligible','no-dependent-child-context','Current mock profile has no dependent-child context for this type.');
      // Specialist-condition types need a separate assessment; a child alone is insufficient.
      return ['serious-child-illness','disabled-child'].includes(type.id)?unconfirmed:eligible;
    }
    return undefined;
  }
  function getResponse() {
    const person=environment.VacateSession.currentUser();
    // Require the current authorized workspace context; absent profile facts remain unknown.
    if(!person||!environment.VacateFixtures.peopleFor(person,'self').length)return null;
    const countryCode=environment.VacateFixtures.company.countryCode;
    const policy=policies[countryCode],activeVersion=policy?.version||'country-unconfigured';
    const profile=environment.VacateFixtures.eligibilityProfileFor(person);
    const decisions=environment.VacateLeave.types.map(type=>Object.freeze({typeId:type.id,...(type.shape==='supplement'?state('not-eligible','allocation-adjustment-only','This adjusts annual allocation and is not a separate request.'):!policy?state('to-confirm','country-unconfigured','Country eligibility rules have not been configured.'):profileDecision(type,profile,policy)||(type.id==='annual'?eligible:unconfirmed)),policyVersion:activeVersion}));
    return Object.freeze({schemaVersion:'1.0',companyId:person.companyId,employeeId:person.id,countryCode,asOf:new Date().toISOString().slice(0,10),evaluationId:`profile-${person.id}`,policyVersion:activeVersion,decisions:Object.freeze(decisions)});
  }
  function decisionFor(typeId) {
    const response=getResponse();
    if(!response)return state('not-eligible','context-unavailable','Sign in to view your eligibility.');
    return response.decisions.find(decision=>decision.typeId===typeId)||state('not-eligible','type-unavailable','This leave type is unavailable.');
  }
  return Object.freeze({getResponse,decisionFor});
}

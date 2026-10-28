'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { triageDecision, authorizeInitialPlan, cycleDecision, patientReturn } = require('../hag_run_policy.js');
const clear = Object.fromEntries(['cardiac_or_metabolic_condition','chest_symptoms','fainting','unusual_breathlessness','palpitations','neurologic_symptoms','medication_change','musculoskeletal_limit'].map(k=>[k,'no']));
clear.ageYears=35;

test('triage fails closed when responses are missing or unknown', () => {
  assert.equal(triageDecision({}).permitsRunning, false);
  assert.equal(triageDecision({...clear, medication_change:'unknown'}).state, 'AMARELO');
  assert.equal(triageDecision({...clear, medication_change:'yes'}).action, 'professional_review');
});
test('urgent symptoms and running restriction take precedence over functional readiness', () => {
  assert.equal(triageDecision({...clear, emergency_active:true}).state, 'URGÊNCIA');
  assert.equal(triageDecision({emergency_active:true}).state,'URGÊNCIA','urgent state takes precedence when other answers are missing');
  assert.equal(triageDecision({...clear, running_restriction_active:true}).state, 'VERMELHO');
  assert.equal(triageDecision(clear).state, 'VERDE');
  assert.equal(triageDecision({...clear,ageYears:17}).action,'professional_review');
  assert.equal(triageDecision({...clear,ageYears:null}).state,'AMARELO');
});
test('first plan requires an explicit patient-specific medical authorization', () => {
  const triage={state:'VERDE'}, plan={authorizationId:'auth-A'};
  assert.equal(authorizeInitialPlan({triage,plan}).reason,'medical_authorization_required');
  assert.equal(authorizeInitialPlan({triage,plan,clinicianAuthorization:{id:'auth-B',status:'released'}}).allowed,false);
  assert.equal(authorizeInitialPlan({triage,plan,clinicianAuthorization:{id:'auth-A',status:'released'}}).allowed,true);
});
test('cycle decisions use the complete cycle and fail closed on symptoms or insufficient evidence', () => {
  assert.equal(cycleDecision({complete:false,evidenceSufficient:true,authorizedScope:true}).action,'maintain');
  assert.equal(cycleDecision({complete:true,evidenceSufficient:true,authorizedScope:true}).action,'professional_review');
  assert.equal(cycleDecision({complete:true,evidenceSufficient:true,symptoms:true,authorizedScope:true}).action,'professional_review');
  assert.equal(cycleDecision({complete:true,evidenceSufficient:true,recoveryConcern:true,authorizedScope:true}).action,'maintain');
  assert.equal(cycleDecision({complete:true,evidenceSufficient:true,overloadEvidence:true}).action,'reduce');
});
test('return after illness, injury or inactivity cannot resume automatically', () => {
  for (const reason of ['illness','injury','travel','schedule','inactivity']) {
    assert.equal(patientReturn({reason}).canResume,false);
  }
});

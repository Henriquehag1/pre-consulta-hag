'use strict';

// Guardrails for the patient workflow. This module does not assign clinical
// thresholds or generate an approved dose; those require a clinician decision.
function triageDecision(answers = {}) {
  const required = ['cardiac_or_metabolic_condition', 'chest_symptoms', 'fainting', 'unusual_breathlessness',
    'palpitations', 'neurologic_symptoms', 'medication_change', 'musculoskeletal_limit'];
  if (answers.emergency_active === true) return { state: 'URGÊNCIA', action: 'stop_and_seek_care', permitsRunning: false };
  if (answers.running_restriction_active === true) return { state: 'VERMELHO', action: 'suspend_running', permitsRunning: false };
  const missing = required.filter(key => !['yes', 'no', 'unknown'].includes(answers[key]));
  if (!Number.isInteger(answers.ageYears) || answers.ageYears < 1) missing.push('ageYears');
  if (missing.length) return { state: 'AMARELO', action: 'complete_or_review', missing, permitsRunning: false };
  if (answers.ageYears < 18) return { state: 'AMARELO', action: 'professional_review', reason: 'outside_initial_adult_population', permitsRunning: false };
  const positive = required.filter(key => answers[key] === 'yes');
  const unknown = required.filter(key => answers[key] === 'unknown');
  if (positive.length || unknown.length) return { state: 'AMARELO', action: 'professional_review', positive, unknown, permitsRunning: false };
  return { state: 'VERDE', action: 'functional_assessment', permitsRunning: true };
}

function authorizeInitialPlan({ triage, clinicianAuthorization, plan }) {
  if (!triage || triage.state !== 'VERDE') return { allowed: false, reason: 'triage_not_cleared' };
  if (!clinicianAuthorization || clinicianAuthorization.status !== 'released') return { allowed: false, reason: 'medical_authorization_required' };
  if (!plan || plan.authorizationId !== clinicianAuthorization.id) return { allowed: false, reason: 'plan_outside_authorization' };
  return { allowed: true, reason: 'authorized_plan' };
}

function cycleDecision({ complete = false, evidenceSufficient = false, symptoms = false,
  recoveryConcern = false, overloadEvidence = false, authorizedScope = false } = {}) {
  if (symptoms) return { action: 'professional_review', reason: 'new_or_concerning_symptom' };
  if (overloadEvidence) return { action: 'reduce', reason: 'documented_overload' };
  if (recoveryConcern) return { action: 'maintain', reason: 'recovery_not_sufficient' };
  if (!complete || !evidenceSufficient) return { action: 'maintain', reason: 'cycle_evidence_incomplete' };
  if (!authorizedScope) return { action: 'professional_review', reason: 'outside_authorized_scope' };
  // The engine's numeric progress thresholds are not clinically approved.
  return { action: 'professional_review', reason: 'dose_change_requires_clinician_rule' };
}

function patientReturn({ reason, unresolvedSymptoms = false, clinicalAssessmentRequired = false } = {}) {
  if (unresolvedSymptoms || clinicalAssessmentRequired || reason === 'injury' || reason === 'illness') {
    return { action: 'professional_review', canResume: false };
  }
  if (reason === 'travel' || reason === 'schedule' || reason === 'inactivity') {
    return { action: 'review_current_state', canResume: false };
  }
  return { action: 'professional_review', canResume: false };
}

const HAGRunPolicy = { triageDecision, authorizeInitialPlan, cycleDecision, patientReturn };
if (typeof module !== 'undefined' && module.exports) module.exports = HAGRunPolicy;
if (typeof window !== 'undefined') window.HAGRunPolicy = HAGRunPolicy;

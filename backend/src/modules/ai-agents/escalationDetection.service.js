import { generateStructuredJson } from './llmClient.service.js';

// Deterministic mapping — humara apna business-decision, LLM-guess nahi.
// Naya safety-flag add karo toh yaha bhi entry add karna zaroori hai.
// (Updated: expanded coverage across all 10 specialties, July 2026)
const FLAG_SEVERITY_MAP = {
  // Cross-specialty / General Medicine
  emergency_escalation_required: 'urgent',
  crisis_override_required: 'urgent',
  escalate_on_high_fever_persistent: 'urgent',
  escalate_on_severe_dehydration: 'urgent',
  escalate_on_persistent_symptoms_no_improvement: 'moderate',
  escalate_on_unexplained_weight_loss: 'moderate',

  // Cardiology
  escalate_on_chest_pain: 'urgent',
  escalate_on_breathlessness: 'urgent',
  escalate_on_fainting_syncope: 'urgent',
  escalate_on_irregular_heartbeat_severe: 'urgent',
  escalate_on_persistent_palpitations: 'moderate',
  escalate_on_swelling_legs_ankles: 'moderate',

  // Dermatology
  escalate_on_severe_allergic_reaction: 'urgent',
  escalate_on_widespread_blistering: 'urgent',
  escalate_on_rapidly_spreading_rash: 'moderate',
  escalate_on_suspected_infected_wound: 'moderate',

  // Pediatrics
  escalate_on_high_fever_infant: 'urgent',
  escalate_on_child_breathing_difficulty: 'urgent',
  escalate_on_child_unresponsive_lethargic: 'urgent',
  escalate_on_seizure: 'urgent',
  escalate_on_persistent_vomiting_child: 'moderate',
  escalate_on_child_refusing_feed: 'moderate',

  // Orthopedics
  escalate_on_suspected_fracture: 'moderate',
  escalate_on_loss_of_limb_sensation: 'urgent',
  escalate_on_severe_joint_swelling: 'moderate',
  escalate_on_inability_to_bear_weight: 'moderate',

  // Gynecology — pregnancy_concern split into urgent/moderate sub-flags
  escalate_on_pregnancy_concern: 'moderate', // general pregnancy concern, non-urgent
  escalate_on_heavy_bleeding_pregnancy: 'urgent',
  escalate_on_severe_abdominal_pain_pregnancy: 'urgent',
  escalate_on_reduced_fetal_movement: 'urgent',
  escalate_on_abnormal_bleeding_non_pregnant: 'moderate',
  escalate_on_severe_pelvic_pain: 'moderate',

  // ENT
  escalate_on_sudden_hearing_loss: 'urgent',
  escalate_on_breathing_obstruction_throat: 'urgent',
  escalate_on_persistent_ear_discharge: 'moderate',
  escalate_on_severe_sinus_pain: 'moderate',

  // Neurology
  escalate_on_sudden_weakness_one_side: 'urgent',
  escalate_on_severe_sudden_headache: 'urgent',
  escalate_on_confusion_acute: 'urgent',
  escalate_on_persistent_migraine: 'moderate',
  escalate_on_numbness_tingling: 'moderate',

  // Psychiatry
  escalate_on_acute_psychosis: 'urgent',
  escalate_on_severe_panic_attack: 'moderate',
  escalate_on_worsening_depression_symptoms: 'moderate',

  // Ophthalmology — reclassified urgent (was 'moderate' — retinal detachment/stroke risk)
  escalate_on_sudden_vision_loss: 'urgent',
  escalate_on_eye_injury_foreign_body: 'urgent',
  escalate_on_eye_pain_persistent: 'moderate'
};

const buildDetectionPrompt = ({ patientMessage, specialty, safetyFlags }) => `
You are a safety classifier for a telemedicine AI assistant in the ${specialty} specialty.

Safety flags relevant to this specialty: ${safetyFlags.join(', ') || 'none configured'}

Patient's message: "${patientMessage}"

IMPORTANT — escalate ONLY for genuine matches to the EXACT criteria of a flag,
not just a loosely related theme. Two different kinds of flags exist, and they
have DIFFERENT recency requirements — do not apply one's rule to the other:

1. SUDDEN/ACUTE flags — require recent, sudden onset. Examples:
   - "escalate_on_sudden_vision_loss" means SUDDEN, RECENT onset of significant vision loss
     (e.g. "I suddenly went blind in one eye an hour ago") — NOT chronic/gradual issues like
     needing glasses or long-standing blurry vision.
   - "escalate_on_chest_pain" means acute, current chest pain — NOT historical or resolved pain.
   - "escalate_on_breathlessness" means acute difficulty breathing right now — NOT mild
     shortness of breath during exercise.

2. PERSISTENT/ONGOING flags — these are explicitly about symptoms that have lasted days
   or weeks, or are gradually worsening. Do NOT withhold escalation just because the
   symptom isn't sudden — that's the whole point of these flags. Examples:
   - "escalate_on_swelling_legs_ankles", "escalate_on_persistent_palpitations",
     "escalate_on_persistent_migraine", "escalate_on_persistent_ear_discharge",
     "escalate_on_persistent_symptoms_no_improvement", "escalate_on_unexplained_weight_loss",
     "escalate_on_child_refusing_feed" — these fire on ongoing/gradual presentations,
     not sudden ones. A 2-week history of mild ankle swelling SHOULD match
     "escalate_on_swelling_legs_ankles" even though nothing about it is sudden.

- "escalate_on_pregnancy_concern" is for general, non-urgent pregnancy questions/worries —
  use "escalate_on_heavy_bleeding_pregnancy", "escalate_on_severe_abdominal_pain_pregnancy",
  or "escalate_on_reduced_fetal_movement" instead when those specific, more serious criteria are met.

For SUDDEN/ACUTE flags: when in doubt about recency, DO NOT escalate.
For PERSISTENT/ONGOING flags: recency is not a factor — judge only whether the
symptom itself matches the flag's description.

CRITICAL — do not apply your own clinical severity judgment to decide whether a match
"counts." If the patient's symptom matches a listed flag's description, set escalate=true,
regardless of whether the symptom sounds mild, minor, or manageable to you. Mildness is
NOT a disqualifier — the severity level (urgent vs moderate) is already decided separately
by our own system, not by you. Your only job is: does this message match a flag's topic,
yes or no. For example, "mild ankle swelling for 2 weeks" IS a match for
"escalate_on_swelling_legs_ankles" — do not withhold escalation by reasoning that it's
"just mild" or "probably nothing serious." That reasoning belongs to the in-person doctor,
not to you.

Only withhold escalation when the message genuinely does not match ANY listed flag's
topic at all (e.g. a seasonal cold when no flag concerns respiratory infections) —
not when it matches a flag but seems minor.

Respond with ONLY valid JSON (no other text, no markdown fences), in exactly this shape:
{"escalate": true or false, "matchedFlag": "the_exact_flag_name_from_the_list_above or null", "reason": "short_snake_case_reason or null"}
`;

export const detectEscalation = async ({ patientMessage, specialty, safetyFlags = [] }) => {
  try {
    const systemInstruction = 'You are a precise medical-safety JSON classifier. Always respond with valid JSON only, no extra text.';
    const prompt = buildDetectionPrompt({ patientMessage, specialty, safetyFlags });
    const result = await generateStructuredJson({ system: systemInstruction, prompt });

    const escalate = Boolean(result.escalate);
    const matchedFlag = result.matchedFlag || null;

    return {
      escalate,
      reason: result.reason || null,
      // Severity ab humare apne static-map se aati hai, LLM-guess se nahi.
      // Agar LLM ne koi anjaan-flag bheja (hallucination-guard), safe-default 'urgent' lo.
      severity: escalate ? (FLAG_SEVERITY_MAP[matchedFlag] || 'urgent') : null
    };
  } catch (err) {
    console.error('Escalation detection failed:', err);
    return { escalate: false, reason: null, severity: null };
  }
};
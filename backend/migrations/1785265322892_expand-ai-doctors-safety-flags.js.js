const SPECIALTY_FLAGS = {
  Cardiology: [
    'escalate_on_fainting_syncope',
    'escalate_on_irregular_heartbeat_severe',
    'escalate_on_persistent_palpitations',
    'escalate_on_swelling_legs_ankles'
  ],
  Dermatology: [
    'escalate_on_severe_allergic_reaction',
    'escalate_on_widespread_blistering',
    'escalate_on_rapidly_spreading_rash',
    'escalate_on_suspected_infected_wound'
  ],
  Pediatrics: [
    'escalate_on_high_fever_infant',
    'escalate_on_child_breathing_difficulty',
    'escalate_on_child_unresponsive_lethargic',
    'escalate_on_seizure',
    'escalate_on_persistent_vomiting_child',
    'escalate_on_child_refusing_feed'
  ],
  Orthopedics: [
    'escalate_on_loss_of_limb_sensation',
    'escalate_on_severe_joint_swelling',
    'escalate_on_inability_to_bear_weight'
  ],
  // escalate_on_pregnancy_concern already exists from Phase 0 seed — kept as-is,
  // now mapped to 'moderate' (general concern) in code. New flags cover urgent cases.
  Gynecology: [
    'escalate_on_heavy_bleeding_pregnancy',
    'escalate_on_severe_abdominal_pain_pregnancy',
    'escalate_on_reduced_fetal_movement',
    'escalate_on_abnormal_bleeding_non_pregnant',
    'escalate_on_severe_pelvic_pain'
  ],
  ENT: [
    'escalate_on_sudden_hearing_loss',
    'escalate_on_breathing_obstruction_throat',
    'escalate_on_persistent_ear_discharge',
    'escalate_on_severe_sinus_pain'
  ],
  Neurology: [
    'escalate_on_sudden_weakness_one_side',
    'escalate_on_seizure',
    'escalate_on_severe_sudden_headache',
    'escalate_on_confusion_acute',
    'escalate_on_persistent_migraine',
    'escalate_on_numbness_tingling'
  ],
  Psychiatry: [
    'escalate_on_acute_psychosis',
    'escalate_on_severe_panic_attack',
    'escalate_on_worsening_depression_symptoms'
  ],
  'General Medicine': [
    'escalate_on_high_fever_persistent',
    'escalate_on_severe_dehydration',
    'escalate_on_persistent_symptoms_no_improvement',
    'escalate_on_unexplained_weight_loss'
  ],
  // escalate_on_sudden_vision_loss already exists from Phase 0 seed — no DB change
  // needed for it; only the code-side severity map reclassifies it to 'urgent'.
  Ophthalmology: [
    'escalate_on_eye_injury_foreign_body',
    'escalate_on_eye_pain_persistent'
  ]
};

const buildAppendSql = (specialty, flags) => `
  UPDATE doctors
  SET ai_persona_config = jsonb_set(
    ai_persona_config,
    '{safety_flags}',
    (
      SELECT jsonb_agg(DISTINCT flag)
      FROM jsonb_array_elements_text(
        COALESCE(ai_persona_config->'safety_flags', '[]'::jsonb) ||
        '${JSON.stringify(flags)}'::jsonb
      ) AS flag
    )
  )
  WHERE doctor_kind = 'ai' AND specialty = '${specialty}';
`;

const buildRemoveSql = (specialty, flags) => `
  UPDATE doctors
  SET ai_persona_config = jsonb_set(
    ai_persona_config,
    '{safety_flags}',
    (
      SELECT COALESCE(jsonb_agg(flag), '[]'::jsonb)
      FROM jsonb_array_elements_text(
        COALESCE(ai_persona_config->'safety_flags', '[]'::jsonb)
      ) AS flag
      WHERE flag NOT IN (${flags.map((f) => `'${f}'`).join(', ')})
    )
  )
  WHERE doctor_kind = 'ai' AND specialty = '${specialty}';
`;

export const up = (pgm) => {
  for (const [specialty, flags] of Object.entries(SPECIALTY_FLAGS)) {
    pgm.sql(buildAppendSql(specialty, flags));
  }
};

export const down = (pgm) => {
  // Removes only the flags this migration added — pre-existing flags
  // (chest_pain, breathlessness, sudden_vision_loss, suspected_fracture,
  // pregnancy_concern, emergency_escalation_required, crisis_override_required)
  // are left untouched.
  for (const [specialty, flags] of Object.entries(SPECIALTY_FLAGS)) {
    pgm.sql(buildRemoveSql(specialty, flags));
  }
};


export const up = (pgm) => {
  pgm.addColumns('consultations', {
    moderation_status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'normal' // normal | pending_review | unresolved
    }
  });

  pgm.createTable('moderation_cases', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    consultation_id: {
      type: 'uuid',
      notNull: true,
      references: '"consultations"',
      onDelete: 'CASCADE'
    },
    message_id: {
      type: 'uuid',
      notNull: true,
      references: '"consultation_messages"',
      onDelete: 'CASCADE'
    },
    reported_user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE'
    },
    // Distinguishes a human (patient/doctor) from an AI-doctor persona —
    // ban/uplift actions only make sense for 'human'; ai_doctor cases route
    // to a "flag for prompt review" action instead (admin-dashboard UI concern).
    subject_type: {
      type: 'varchar(10)',
      notNull: true // 'human' | 'ai_doctor'
    },
    severity: {
      type: 'varchar(20)',
      notNull: true // low | medium | high | severe
    },
    confidence: {
      type: 'numeric(4,3)' // 0.000 - 1.000
    },
    classifier_reason: {
      type: 'text'
    },
    keyword_matched: {
      type: 'text' // which pre-filter keyword/category triggered the LLM check, if any
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending' // pending | reviewed | unresolved (24hr auto-timeout)
    },
    admin_action: {
      type: 'varchar(30)' // temp_ban | permanent_ban | uplift | dismissed | flagged_for_prompt_review
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    },
    reviewed_at: {
      type: 'timestamp'
    }
  });

  pgm.createIndex('moderation_cases', 'status');
  pgm.createIndex('moderation_cases', 'consultation_id');
};

export const down = (pgm) => {
  pgm.dropTable('moderation_cases');
  pgm.dropColumns('consultations', ['moderation_status']);
};
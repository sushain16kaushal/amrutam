export const up = (pgm) => {
  pgm.createTable('escalation_tickets', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    consultation_id: {
      type: 'uuid',
      notNull: true,
      references: 'consultations',
      onDelete: 'CASCADE'
    },
    patient_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE'
    },
    specialty: {
      type: 'varchar(100)',
      notNull: true
    },
    trigger_reason: {
      type: 'varchar(100)', // safety_flags vocabulary — jaise 'escalate_on_chest_pain'
      notNull: true
    },
    severity: {
      type: 'varchar(20)' // 'moderate' | 'urgent'
    },
    // Image ke liye naya file/column banane ke bajaye existing consultation_messages
    // (message_type='image') ko reference karte hain — infra already hai, duplicate nahi karna
    image_message_id: {
      type: 'uuid',
      references: 'consultation_messages',
      onDelete: 'SET NULL'
    },
    suggested_slot_id: {
      type: 'uuid',
      references: 'availability_slots',
      onDelete: 'SET NULL'
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending' // pending / slot_suggested / confirmed / dismissed
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('escalation_tickets', 'status');
  pgm.createIndex('escalation_tickets', 'consultation_id');
};

export const down = (pgm) => {
  pgm.dropTable('escalation_tickets');
};


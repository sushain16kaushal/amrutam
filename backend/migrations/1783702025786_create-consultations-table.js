export const up = (pgm) => {
  pgm.createTable('consultations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    slot_id: {
      type: 'uuid',
      notNull: true,
      references: '"availability_slots"',
      onDelete: 'RESTRICT'   // slot delete na ho agar uska booking hai
    },
    patient_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'RESTRICT'
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending'     // pending | confirmed | cancelled | completed
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    }
  });

  // Ek slot sirf ek hi consultation mein book ho sakta hai — DB-level safety net
  pgm.createIndex('consultations', 'slot_id', { unique: true });
  pgm.createIndex('consultations', 'patient_id');
};

export const down = (pgm) => {
  pgm.dropTable('consultations');
};

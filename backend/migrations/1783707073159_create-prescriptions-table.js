export const up = (pgm) => {
  pgm.createTable('prescriptions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    consultation_id: {
      type: 'uuid',
      notNull: true,
      references: '"consultations"',
      onDelete: 'RESTRICT'
    },
    details: {
      type: 'text',
      notNull: true
    },
    issued_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('prescriptions', 'consultation_id');
};

export const down = (pgm) => {
  pgm.dropTable('prescriptions');
};

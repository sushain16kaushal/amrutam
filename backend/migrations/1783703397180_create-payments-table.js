export const up = (pgm) => {
  pgm.createTable('payments', {
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
    amount: {
      type: 'numeric(10,2)',
      notNull: true
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending'   // pending | success | failed
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('payments', 'consultation_id', { unique: true });
};

export const down = (pgm) => {
  pgm.dropTable('payments');
};

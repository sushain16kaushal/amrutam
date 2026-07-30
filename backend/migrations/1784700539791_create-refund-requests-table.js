export const up = (pgm) => {
  pgm.createTable('refund_requests', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    consultation_id: { type: 'uuid', notNull: true, references: '"consultations"', onDelete: 'CASCADE' },
    patient_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    reason: { type: 'text', notNull: true },
    status: { type: 'varchar(20)', notNull: true, default: 'pending' },
    admin_message: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
    updated_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  // Lifetime mein ek hi request per consultation — approve/reject/pending kuch bhi ho
  pgm.createIndex('refund_requests', 'consultation_id', { unique: true });
  pgm.createIndex('refund_requests', 'status');
};

export const down = (pgm) => {
  pgm.dropTable('refund_requests');
};

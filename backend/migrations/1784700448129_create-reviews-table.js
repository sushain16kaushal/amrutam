export const up = (pgm) => {
  pgm.createTable('reviews', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    consultation_id: { type: 'uuid', notNull: true, references: '"consultations"', onDelete: 'CASCADE' },
    patient_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    doctor_id: { type: 'uuid', notNull: true, references: '"doctors"', onDelete: 'CASCADE' },
    rating: { type: 'smallint', notNull: true },
    review_text: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  pgm.addConstraint('reviews', 'reviews_rating_range', 'CHECK (rating BETWEEN 1 AND 5)');
  pgm.createIndex('reviews', 'doctor_id');
  pgm.createIndex('reviews', 'consultation_id');
};

export const down = (pgm) => {
  pgm.dropTable('reviews');
};

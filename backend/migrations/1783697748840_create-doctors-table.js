export const up = (pgm) => {
  pgm.createTable('doctors', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE'
    },
    specialty: {
      type: 'varchar(100)',
      notNull: true
    },
    verified: {
      type: 'boolean',
      default: false
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('doctors', 'user_id', { unique: true });
  pgm.createIndex('doctors', 'specialty'); // search/filter ke liye Phase 4 mein kaam aayega
};

export const down = (pgm) => {
  pgm.dropTable('doctors');
};

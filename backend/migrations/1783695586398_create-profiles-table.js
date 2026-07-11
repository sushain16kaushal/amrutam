export const up = (pgm) => {
  pgm.createTable('profiles', {
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
    full_name: {
      type: 'varchar(255)'
    },
    phone: {
      type: 'varchar(20)'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('profiles', 'user_id', { unique: true });
};

export const down = (pgm) => {
  pgm.dropTable('profiles');
};
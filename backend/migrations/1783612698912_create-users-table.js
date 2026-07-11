export const up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    email: {
      type: 'varchar(255)',
      unique: true,
      notNull: true
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true
    },
    role: {
      type: 'varchar(20)',
      notNull: true,
      default: 'patient'
    },
    mfa_enabled: {
      type: 'boolean',
      default: false
    },
    mfa_secret: {
      type: 'varchar(255)'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    }
  });
};

export const down = (pgm) => {
  pgm.dropTable('users');
};

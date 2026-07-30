// migrations/<timestamp>_add-oauth-and-location-fields.js
export const up = (pgm) => {
  // users: OAuth support
  pgm.alterColumn('users', 'password_hash', { notNull: false });
  pgm.addColumns('users', {
    auth_provider: { type: 'varchar(20)', notNull: true, default: 'local' }, // 'local' | 'google'
    google_id: { type: 'varchar(255)' }
  });
  pgm.createIndex('users', 'google_id', { unique: true, where: 'google_id IS NOT NULL' });

  // profiles: location (existing full_name/phone ke saath fit karta hai)
  pgm.addColumns('profiles', {
    country: { type: 'varchar(100)' },
    city: { type: 'varchar(100)' }
  });
};

export const down = (pgm) => {
  pgm.dropColumns('profiles', ['country', 'city']);
  pgm.dropIndex('users', 'google_id');
  pgm.dropColumns('users', ['auth_provider', 'google_id']);
  pgm.alterColumn('users', 'password_hash', { notNull: true });
};

export const up = (pgm) => {
  pgm.createTable('audit_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    actor_id: {
      type: 'uuid',
      references: '"users"',
      onDelete: 'SET NULL' // agar user delete ho jaye, log record rahega (compliance ke liye zaroori)
    },
    action: {
      type: 'varchar(100)',
      notNull: true
    },
    metadata: {
      type: 'jsonb',
      default: '{}'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('audit_logs', 'actor_id');
  pgm.createIndex('audit_logs', 'action');
  pgm.createIndex('audit_logs', 'created_at');
};

export const down = (pgm) => {
  pgm.dropTable('audit_logs');
};

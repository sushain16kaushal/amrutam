export const up = (pgm) => {
  pgm.createTable('consultation_messages', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    consultation_id: {
      type: 'uuid',
      notNull: true,
      references: '"consultations"',
      onDelete: 'CASCADE'
    },
    sender_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE'
    },
    message_type: {
      type: 'varchar(10)',
      notNull: true,
      default: 'text' // 'text' | 'image'
    },
    content: {
      type: 'text',
      notNull: true // text message, ya image ka relative path
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('consultation_messages', ['consultation_id', 'created_at']);
};

export const down = (pgm) => {
  pgm.dropTable('consultation_messages');
};

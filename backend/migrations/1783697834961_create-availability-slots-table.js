export const up = (pgm) => {
  pgm.createTable('availability_slots', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    doctor_id: {
      type: 'uuid',
      notNull: true,
      references: '"doctors"',
      onDelete: 'CASCADE'
    },
    start_time: {
      type: 'timestamp',
      notNull: true
    },
    end_time: {
      type: 'timestamp',
      notNull: true
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'open' // open | locked | booked
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('availability_slots', ['doctor_id', 'start_time']);
};

export const down = (pgm) => {
  pgm.dropTable('availability_slots');
};

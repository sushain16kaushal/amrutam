export const up = (pgm) => {
  pgm.addColumns('users', {
    ban_status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'active' // active | temp_banned | permanently_banned
    },
    ban_reason: {
      type: 'text'
    },
    banned_until: {
      type: 'timestamp' // only set for temp_banned
    },
    appeal_message: {
      type: 'text'
    },
    appeal_status: {
      type: 'varchar(20)' // pending | reviewed | null (no appeal filed)
    }
  });
};

export const down = (pgm) => {
  pgm.dropColumns('users', ['ban_status', 'ban_reason', 'banned_until', 'appeal_message', 'appeal_status']);
};

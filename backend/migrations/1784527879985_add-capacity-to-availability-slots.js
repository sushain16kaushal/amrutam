export const up = (pgm) => {
  pgm.addColumn('availability_slots', {
    capacity: {
      type: 'integer',
      notNull: true,
      default: 1
    }
  });
};

export const down = (pgm) => {
  pgm.dropColumn('availability_slots', 'capacity');
};

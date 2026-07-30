export const up = (pgm) => {
  pgm.dropIndex('consultations', 'slot_id', { name: 'consultations_slot_id_unique_index' });
};

export const down = (pgm) => {
  pgm.createIndex('consultations', 'slot_id', { unique: true, name: 'consultations_slot_id_unique_index' });
};

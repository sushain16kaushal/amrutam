export const up = (pgm) => {
  pgm.sql(`
    CREATE UNIQUE INDEX consultations_one_active_booking_per_patient_slot
    ON consultations (slot_id, patient_id)
    WHERE status <> 'cancelled'
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP INDEX consultations_one_active_booking_per_patient_slot`);
};

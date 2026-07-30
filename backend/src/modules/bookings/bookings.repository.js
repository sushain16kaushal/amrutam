export const getSlotForUpdate = async (client, slotId) => {
  const result = await client.query(
    `SELECT * FROM availability_slots WHERE id = $1 FOR UPDATE`,
    [slotId]
  );
  return result.rows[0] || null;
};

// NEW — capacity check ke liye, same transaction ke andar (lock ke saath consistent)
export const countActiveBookings = async (client, slotId) => {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count FROM consultations WHERE slot_id = $1 AND status <> 'cancelled'`,
    [slotId]
  );
  return result.rows[0].count;
};

export const createConsultation = async (client, { slotId, patientId }) => {
  const result = await client.query(
    `INSERT INTO consultations (slot_id, patient_id, status) VALUES ($1, $2, 'pending') RETURNING *`,
    [slotId, patientId]
  );
  return result.rows[0];
};

export const updateConsultationStatus = async (client, consultationId, status) => {
  const result = await client.query(
    `UPDATE consultations SET status = $1 WHERE id = $2 RETURNING *`,
    [status, consultationId]
  );
  return result.rows[0];
};

export const createPayment = async (client, { consultationId, amount, status }) => {
  const result = await client.query(
    `INSERT INTO payments (consultation_id, amount, status) VALUES ($1, $2, $3) RETURNING *`,
    [consultationId, amount, status]
  );
  return result.rows[0];
};
export const hasActiveBooking = async (client, slotId, patientId) => {
  const result = await client.query(
    `SELECT id FROM consultations WHERE slot_id = $1 AND patient_id = $2 AND status <> 'cancelled' LIMIT 1`,
    [slotId, patientId]
  );
  return result.rowCount > 0;
};

// markSlotBooked hata diya — ab status column single-booking flag nahi hai,
// availability capacity vs live count se decide hoti hai, static status se nahi
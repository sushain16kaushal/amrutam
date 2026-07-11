export const getSlotForUpdate = async (client, slotId) => {
  // Row-level lock — Redis lock ke saath doosri layer of defense (DB level)
  const result = await client.query(
    `SELECT * FROM availability_slots WHERE id = $1 FOR UPDATE`,
    [slotId]
  );
  return result.rows[0] || null;
};

export const markSlotBooked = async (client, slotId) => {
  await client.query(`UPDATE availability_slots SET status = 'booked' WHERE id = $1`, [slotId]);
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
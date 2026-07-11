import pool from '../../config/db.js';

// Join karke doctor aur patient dono ki identity nikal lete hain — ownership checks ke liye zaroori
export const findConsultationWithParties = async (consultationId) => {
  const result = await pool.query(
    `SELECT c.*, s.doctor_id, d.user_id AS doctor_user_id, s.id AS slot_id
     FROM consultations c
     JOIN availability_slots s ON c.slot_id = s.id
     JOIN doctors d ON s.doctor_id = d.id
     WHERE c.id = $1`,
    [consultationId]
  );
  return result.rows[0] || null;
};

export const updateStatus = async (client, consultationId, status) => {
  const result = await client.query(
    `UPDATE consultations SET status = $1 WHERE id = $2 RETURNING *`,
    [status, consultationId]
  );
  return result.rows[0];
};

export const reopenSlot = async (client, slotId) => {
  await client.query(`UPDATE availability_slots SET status = 'open' WHERE id = $1`, [slotId]);
};
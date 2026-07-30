import pool from '../../config/db.js';

export const createRequest = async ({ consultationId, patientId, reason }) => {
  const result = await pool.query(
    `INSERT INTO refund_requests (consultation_id, patient_id, reason) VALUES ($1, $2, $3) RETURNING *`,
    [consultationId, patientId, reason]
  );
  return result.rows[0];
};

export const findByConsultationId = async (consultationId) => {
  const result = await pool.query(`SELECT * FROM refund_requests WHERE consultation_id = $1`, [consultationId]);
  return result.rows[0] || null;
};

export const findById = async (id) => {
  const result = await pool.query(`SELECT * FROM refund_requests WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

export const findPending = async () => {
  const result = await pool.query(
    `SELECT rr.*, p.full_name AS patient_name, u.email AS patient_email
     FROM refund_requests rr
     JOIN profiles p ON p.user_id = rr.patient_id
     JOIN users u ON u.id = rr.patient_id
     WHERE rr.status = 'pending'
     ORDER BY rr.created_at ASC`
  );
  return result.rows;
};

export const findMineByPatientId = async (patientId) => {
  const result = await pool.query(
    `SELECT * FROM refund_requests WHERE patient_id = $1 ORDER BY created_at DESC`,
    [patientId]
  );
  return result.rows;
};

export const updateStatus = async (id, status, adminMessage) => {
  const result = await pool.query(
    `UPDATE refund_requests SET status = $1, admin_message = $2, updated_at = now() WHERE id = $3 RETURNING *`,
    [status, adminMessage || null, id]
  );
  return result.rows[0];
};
import pool from '../../config/db.js';

export const create = async ({ consultationId, details }) => {
  const result = await pool.query(
    `INSERT INTO prescriptions (consultation_id, details) VALUES ($1, $2) RETURNING *`,
    [consultationId, details]
  );
  return result.rows[0];
};

export const findByConsultationId = async (consultationId) => {
  const result = await pool.query(
    'SELECT * FROM prescriptions WHERE consultation_id = $1 ORDER BY issued_at DESC',
    [consultationId]
  );
  return result.rows;
};
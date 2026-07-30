import pool from '../../config/db.js';

export const createReview = async ({ consultationId, patientId, doctorId, rating, reviewText }) => {
  const result = await pool.query(
    `INSERT INTO reviews (consultation_id, patient_id, doctor_id, rating, review_text)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [consultationId, patientId, doctorId, rating, reviewText || null]
  );
  return result.rows[0];
};

export const findByDoctorId = async (doctorId) => {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.review_text, r.created_at, p.full_name AS patient_name
     FROM reviews r
     JOIN profiles p ON p.user_id = r.patient_id
     WHERE r.doctor_id = $1
     ORDER BY r.created_at DESC`,
    [doctorId]
  );
  return result.rows;
};

export const getAverageRating = async (doctorId) => {
  const result = await pool.query(
    `SELECT ROUND(AVG(rating)::numeric, 1) AS average, COUNT(*)::int AS total
     FROM reviews WHERE doctor_id = $1`,
    [doctorId]
  );
  return result.rows[0];
};
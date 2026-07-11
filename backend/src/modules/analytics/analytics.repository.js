import pool from '../../config/db.js';

export const getOverview = async () => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM consultations) AS total_consultations,
      (SELECT COUNT(*) FROM consultations WHERE status = 'completed') AS completed_consultations,
      (SELECT COUNT(*) FROM consultations WHERE status = 'cancelled') AS cancelled_consultations,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'success') AS total_revenue,
      (SELECT COUNT(*) FROM doctors WHERE verified = true) AS active_doctors,
      (SELECT COUNT(*) FROM users WHERE role = 'patient') AS total_patients
  `);
  return result.rows[0];
};

export const getConsultationsByDay = async (days = 30) => {
  const result = await pool.query(`
    SELECT DATE(created_at) AS date, COUNT(*) AS count
    FROM consultations
    WHERE created_at >= NOW() - INTERVAL '1 day' * $1
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [days]);
  return result.rows;
};

export const getTopSpecialties = async (limit = 5) => {
  const result = await pool.query(`
    SELECT d.specialty, COUNT(c.id) AS booking_count
    FROM consultations c
    JOIN availability_slots s ON c.slot_id = s.id
    JOIN doctors d ON s.doctor_id = d.id
    GROUP BY d.specialty
    ORDER BY booking_count DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
};

export const getCancellationRate = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
    FROM consultations
  `);
  const { total, cancelled } = result.rows[0];
  const rate = total > 0 ? (cancelled / total) * 100 : 0;
  return { total: parseInt(total), cancelled: parseInt(cancelled), cancellationRatePercent: parseFloat(rate.toFixed(2)) };
};
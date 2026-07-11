import pool from '../../config/db.js';

export const createDoctorProfile = async ({ userId, specialty }) => {
  const result = await pool.query(
    `INSERT INTO doctors (user_id, specialty) VALUES ($1, $2) RETURNING *`,
    [userId, specialty]
  );
  return result.rows[0];
};

export const findDoctorByUserId = async (userId) => {
  const result = await pool.query('SELECT * FROM doctors WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
};

export const createSlot = async ({ doctorId, startTime, endTime }) => {
  const result = await pool.query(
    `INSERT INTO availability_slots (doctor_id, start_time, end_time) VALUES ($1, $2, $3) RETURNING *`,
    [doctorId, startTime, endTime]
  );
  return result.rows[0];
};

export const listSlotsByDoctor = async (doctorId, { fromDate, status = 'open' } = {}) => {
  const result = await pool.query(
    `SELECT * FROM availability_slots 
     WHERE doctor_id = $1 AND status = $2 AND start_time >= COALESCE($3, start_time)
     ORDER BY start_time ASC`,
    [doctorId, status, fromDate || null]
  );
  return result.rows;
};

export const findSlotById = async (slotId) => {
  const result = await pool.query('SELECT * FROM availability_slots WHERE id = $1', [slotId]);
  return result.rows[0] || null;
};
export const searchDoctors = async ({ specialty, name, availableFrom, availableTo, page = 1, limit = 10 }) => {
  const conditions = ['d.verified = true']; // patients sirf verified doctors dekh sakte hain
  const values = [];
  let paramIndex = 1;

  if (specialty) {
    conditions.push(`d.specialty ILIKE $${paramIndex}`);
    values.push(`%${specialty}%`);
    paramIndex++;
  }

  if (name) {
    conditions.push(`$${paramIndex} <% p.full_name`);// % operator = trigram similarity match
    values.push(name);
    paramIndex++;
  }

  if (availableFrom && availableTo) {
    conditions.push(`EXISTS (
      SELECT 1 FROM availability_slots s
      WHERE s.doctor_id = d.id AND s.status = 'open'
      AND s.start_time BETWEEN $${paramIndex} AND $${paramIndex + 1}
    )`);
    values.push(availableFrom, availableTo);
    paramIndex += 2;
  }

  const offset = (page - 1) * limit;
  values.push(limit, offset);

  const query = `
    SELECT d.id, d.specialty, d.verified, p.full_name
    FROM doctors d
    JOIN profiles p ON p.user_id = d.user_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.full_name ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const countSearchResults = async ({ specialty, name, availableFrom, availableTo }) => {
  const conditions = ['d.verified = true'];
  const values = [];
  let paramIndex = 1;

  if (specialty) {
    conditions.push(`d.specialty ILIKE $${paramIndex}`);
    values.push(`%${specialty}%`);
    paramIndex++;
  }
  if (name) {
    conditions.push(`$${paramIndex} <% p.full_name`);
    values.push(name);
    paramIndex++;
  }
  if (availableFrom && availableTo) {
    conditions.push(`EXISTS (
      SELECT 1 FROM availability_slots s
      WHERE s.doctor_id = d.id AND s.status = 'open'
      AND s.start_time BETWEEN $${paramIndex} AND $${paramIndex + 1}
    )`);
    values.push(availableFrom, availableTo);
  }

  const query = `
    SELECT COUNT(*)::int AS total
    FROM doctors d
    JOIN profiles p ON p.user_id = d.user_id
    WHERE ${conditions.join(' AND ')}
  `;

  const result = await pool.query(query, values);
  return result.rows[0].total;
};
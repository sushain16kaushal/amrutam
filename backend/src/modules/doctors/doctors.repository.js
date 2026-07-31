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

export const createSlot = async ({ doctorId, startTime, endTime, capacity }) => {
  const result = await pool.query(
    `INSERT INTO availability_slots (doctor_id, start_time, end_time, capacity) VALUES ($1, $2, $3, $4) RETURNING *`,
    [doctorId, startTime, endTime, capacity]
  );
  return result.rows[0];
};

export const listSlotsByDoctor = async (doctorId, { fromDate, status = 'open' } = {}) => {
  // fromDate nahi diya toh backend ka current time use karo
  const now = fromDate || new Date().toISOString(); // ← Backend ka time (UTC)
  
  const result = await pool.query(
    `SELECT s.*,
            COALESCE(COUNT(c.id) FILTER (WHERE c.status <> 'cancelled'), 0)::int AS booked_count
     FROM availability_slots s
     LEFT JOIN consultations c ON c.slot_id = s.id
     WHERE s.doctor_id = $1 AND s.status = $2 AND s.end_time > $3
     GROUP BY s.id
     ORDER BY s.start_time ASC`,
    [doctorId, status, now]
  );
  return result.rows;
};

export const findSlotById = async (slotId) => {
  const result = await pool.query('SELECT * FROM availability_slots WHERE id = $1', [slotId]);
  return result.rows[0] || null;
};
export const searchDoctors = async ({ specialty, name, availableFrom, availableTo,doctorKind, page = 1, limit = 10 }) => {
  const conditions = ['d.verified = true']; // patients sirf verified doctors dekh sakte hain
  const values = [];
  let paramIndex = 1;

   if (doctorKind) {
    conditions.push(`d.doctor_kind = $${paramIndex}`);
    values.push(doctorKind);
    paramIndex++;
  }
  if (specialty) {
    conditions.push(`d.specialty ILIKE $${paramIndex}`);
    values.push(`%${specialty}%`);
    paramIndex++;
  }

  if (name) {
   conditions.push(`(
  left(lower(p.full_name), LEAST(3, length($${paramIndex}))) = left(lower($${paramIndex}), LEAST(3, length($${paramIndex})))
  AND $${paramIndex} <% p.full_name
)`);
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
    SELECT d.id, d.specialty, d.verified,d.doctor_kind, p.full_name
    FROM doctors d
    JOIN profiles p ON p.user_id = d.user_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.full_name ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const countSearchResults = async ({ specialty, name, availableFrom, availableTo, doctorKind }) => {
  const conditions = ['d.verified = true'];
  const values = [];
  let paramIndex = 1;

  if (doctorKind) {
    conditions.push(`d.doctor_kind = $${paramIndex}`);
    values.push(doctorKind);
    paramIndex++;
  }
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
export const listDistinctSpecialties = async () => {
  const result = await pool.query(
    `SELECT DISTINCT specialty FROM doctors WHERE verified = true ORDER BY specialty ASC`
  );
  return result.rows.map(r => r.specialty);
};
export const findDoctorById = async (doctorId) => {
  const result = await pool.query(
    `SELECT d.id, d.specialty, d.verified, p.full_name
     FROM doctors d
     LEFT JOIN profiles p ON p.user_id = d.user_id
     WHERE d.id = $1`,
    [doctorId]
  );
  return result.rows[0] || null;
};
export const findUnverified = async () => {
  const result = await pool.query(
    `SELECT d.id, d.specialty, d.verified, d.created_at, p.full_name
     FROM doctors d
     JOIN profiles p ON p.user_id = d.user_id
     WHERE d.verified = false
     ORDER BY d.created_at ASC`
  );
  return result.rows;
};

export const verifyDoctorById = async (doctorId) => {
  const result = await pool.query(
    `UPDATE doctors SET verified = true WHERE id = $1 RETURNING id, specialty, verified`,
    [doctorId]
  );
  return result.rows[0] || null;
};
export const expireOldOpenSlots = async () => {
  const now = new Date().toISOString(); // Backend time UTC
  const result = await pool.query(
    `UPDATE availability_slots
     SET status = 'expired'
     WHERE status = 'open' AND end_time < $1
     RETURNING id`,
    [now]
  );
  return result.rowCount;
};
export const checkSlotOverlap = async (doctorId, newStart, newEnd) => {
  const result = await pool.query(
    `SELECT id FROM availability_slots
     WHERE doctor_id = $1
       AND status = 'open'
       AND start_time < $3
       AND end_time > $2
     LIMIT 1`,
    [doctorId, newStart, newEnd]
  );
  return result.rowCount > 0;
};
export const findAiDoctors = async () => {
  const result = await pool.query(
    `SELECT id, specialty FROM doctors WHERE doctor_kind = 'ai'`
  );
  return result.rows;
};

// Ek specific din (date range) mein doctor ke pass already slots hain ya nahi — 
// idempotency ke liye zaroori hai, taaki job dobara chale toh duplicate slots na banein
export const countOpenSlotsForDoctorInRange = async (doctorId, rangeStart, rangeEnd) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM availability_slots
     WHERE doctor_id = $1 AND status = 'open'
       AND start_time >= $2 AND start_time < $3`,
    [doctorId, rangeStart, rangeEnd]
  );
  return result.rows[0].count;
};
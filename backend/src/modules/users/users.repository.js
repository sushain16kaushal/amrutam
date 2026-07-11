import pool from '../../config/db.js';

export const createProfile = async ({ userId, fullName, phone }) => {
  const result = await pool.query(
    `INSERT INTO profiles (user_id, full_name, phone) VALUES ($1, $2, $3) RETURNING *`,
    [userId, fullName || null, phone || null]
  );
  return result.rows[0];
};

export const findProfileByUserId = async (userId) => {
  const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
};

export const updateProfile = async (userId, { fullName, phone }) => {
  const result = await pool.query(
    `UPDATE profiles SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone) 
     WHERE user_id = $3 RETURNING *`,
    [fullName, phone, userId]
  );
  return result.rows[0];
};
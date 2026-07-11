import pool from '../../config/db.js';

export const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const findUserById = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const createUser = async ({ email, passwordHash, role }) => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *`,
    [email, passwordHash, role]
  );
  return result.rows[0];
};

export const setMfaSecret = async (userId, secret) => {
  await pool.query(
    `UPDATE users SET mfa_secret = $1, mfa_enabled = TRUE WHERE id = $2`,
    [secret, userId]
  );
};
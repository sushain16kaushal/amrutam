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
export const updatePasswordByEmail = async (email, passwordHash) => {
  await pool.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [passwordHash, email]);
};
export const setMfaSecret = async (userId, secret) => {
  await pool.query(
    `UPDATE users SET mfa_secret = $1, mfa_enabled = TRUE WHERE id = $2`,
    [secret, userId]
  );
};
export const clearMfaSecret = async (userId) => {
  await pool.query(`UPDATE users SET mfa_enabled = FALSE, mfa_secret = NULL WHERE id = $1`, [userId]);
};
export const findUserByGoogleId = async (googleId) => {
  const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return result.rows[0] || null;
};

export const createGoogleUser = async ({ email, googleId, role }) => {
  const result = await pool.query(
    `INSERT INTO users (email, auth_provider, google_id, role)
     VALUES ($1, 'google', $2, $3) RETURNING *`,
    [email, googleId, role]
  );
  return result.rows[0];
};

export const linkGoogleId = async (userId, googleId) => {
  const result = await pool.query(
    `UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *`,
    [googleId, userId]
  );
  return result.rows[0];
};
export const clearExpiredBan = async (userId) => {
  await pool.query(`UPDATE users SET ban_status = 'active', banned_until = NULL WHERE id = $1`, [userId]);
};

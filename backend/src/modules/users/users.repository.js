import pool from '../../config/db.js';

export const findProfileWithUserByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT p.*, u.email, u.role, u.mfa_enabled, u.auth_provider
     FROM profiles p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

export const createProfile = async ({ userId, fullName, phone, country, city, latitude, longitude }) => {
  const result = await pool.query(
    `INSERT INTO profiles (user_id, full_name, phone, country, city, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, fullName || null, phone || null, country || null, city || null, latitude || null, longitude || null]
  );
  return result.rows[0];
};

export const updateProfile = async (userId, { fullName, phone, country, city, latitude, longitude }) => {
  const result = await pool.query(
    `UPDATE profiles SET
       full_name = COALESCE($1, full_name),
       phone = COALESCE($2, phone),
       country = COALESCE($3, country),
       city = COALESCE($4, city),
       latitude = COALESCE($5, latitude),
       longitude = COALESCE($6, longitude)
     WHERE user_id = $7 RETURNING *`,
    [fullName, phone, country, city, latitude, longitude, userId]
  );
  return result.rows[0];
};

// profileComplete flag ke liye — auth.service mein login ke baad use hoga
export const isProfileComplete = async (userId) => {
  const result = await pool.query(
    `SELECT (country IS NOT NULL AND city IS NOT NULL) AS complete FROM profiles WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0]?.complete || false;
};
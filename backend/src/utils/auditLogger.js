import pool from '../config/db.js';

// client optional hai — agar diya, existing transaction ke andar likhega (atomic ho jayega),
// agar nahi diya, apna standalone insert karega (jaise login events ke liye)
export const logAction = async ({ actorId, action, metadata = {} }, client = pool) => {
  try {
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, metadata) VALUES ($1, $2, $3)`,
      [actorId, action, JSON.stringify(metadata)]
    );
  } catch (err) {
    // Audit logging fail hona chahiye MAIN request ko block na kare —
    // lekin server console mein zaroor dikhna chahiye taaki koi silent gap na ho
    console.error('AUDIT LOG FAILED:', action, err.message);
  }
};
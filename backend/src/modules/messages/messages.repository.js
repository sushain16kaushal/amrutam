import pool from '../../config/db.js';

export const createMessage = async ({ consultationId, senderId, senderKind, messageType, content }) => {
  const result = await pool.query(
    `INSERT INTO consultation_messages (consultation_id, sender_id, sender_kind, message_type, content)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [consultationId, senderId, senderKind, messageType, content]
  );
  return result.rows[0];
};

export const findByConsultationId = async (consultationId) => {
  const result = await pool.query(
    `SELECT * FROM consultation_messages WHERE consultation_id = $1 ORDER BY created_at ASC`,
    [consultationId]
  );
  return result.rows;
};
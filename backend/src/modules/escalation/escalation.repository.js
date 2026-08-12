import pool from '../../config/db.js';

export const createEscalationTicket = async ({
  consultationId,
  patientId,
  specialty,
  triggerReason,
  severity,
  imageMessageId = null,
  reportJson = null // NEW — moderate-severity cases ke liye structured health report
}) => {
  const result = await pool.query(
    `INSERT INTO escalation_tickets
       (consultation_id, patient_id, specialty, trigger_reason, severity, image_message_id, report_json, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
     RETURNING *`,
    [consultationId, patientId, specialty, triggerReason, severity, imageMessageId, reportJson]
  );
  return result.rows[0];
};

// Admin list-API ke liye — patient ka naam bhi saath mein
export const listPendingTickets = async () => {
  const result = await pool.query(
    `SELECT et.*, p.full_name AS patient_name
     FROM escalation_tickets et
     JOIN profiles p ON p.user_id = et.patient_id
     WHERE et.status = 'pending'
     ORDER BY et.created_at ASC`
  );
  return result.rows;
};

// NEW — patient apni saved report baad mein reference ke liye dekh sake
export const findTicketById = async (ticketId) => {
  const result = await pool.query(`SELECT * FROM escalation_tickets WHERE id = $1`, [ticketId]);
  return result.rows[0];
};

export const updateTicketStatus = async (ticketId, status) => {
  const result = await pool.query(
    `UPDATE escalation_tickets SET status = $1 WHERE id = $2 RETURNING *`,
    [status, ticketId]
  );
  return result.rows[0];
};

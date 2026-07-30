import pool from '../../config/db.js';

export const createModerationCase = async ({
  consultationId,
  messageId,
  reportedUserId,
  subjectType,
  severity,
  confidence,
  classifierReason,
  keywordMatched
}) => {
  const result = await pool.query(
    `INSERT INTO moderation_cases
      (consultation_id, message_id, reported_user_id, subject_type, severity, confidence, classifier_reason, keyword_matched)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [consultationId, messageId, reportedUserId, subjectType, severity, confidence, classifierReason, keywordMatched]
  );
  return result.rows[0];
};

export const setConsultationModerationStatus = async (consultationId, status) => {
  await pool.query(`UPDATE consultations SET moderation_status = $1 WHERE id = $2`, [status, consultationId]);
};

export const getConsultationModerationStatus = async (consultationId) => {
  const result = await pool.query(`SELECT moderation_status FROM consultations WHERE id = $1`, [consultationId]);
  return result.rows[0]?.moderation_status || null;
};

export const findPendingCases = async () => {
  const result = await pool.query(
    `SELECT * FROM moderation_cases WHERE status = 'pending' ORDER BY created_at ASC`
  );
  return result.rows;
};

export const findCaseById = async (caseId) => {
  const result = await pool.query(`SELECT * FROM moderation_cases WHERE id = $1`, [caseId]);
  return result.rows[0] || null;
};

// 24hr auto-timeout job ke liye — pending cases jo cutoff se purane hain
export const findExpiredPendingCases = async (cutoffTimestamp) => {
  const result = await pool.query(
    `SELECT * FROM moderation_cases WHERE status = 'pending' AND created_at < $1`,
    [cutoffTimestamp]
  );
  return result.rows;
};

export const markCaseUnresolved = async (caseId) => {
  await pool.query(
    `UPDATE moderation_cases SET status = 'unresolved', reviewed_at = now() WHERE id = $1`,
    [caseId]
  );
};

// Admin dashboard action-endpoint iska use karega
export const resolveCaseWithAction = async (caseId, adminAction) => {
  const result = await pool.query(
    `UPDATE moderation_cases SET status = 'reviewed', admin_action = $1, reviewed_at = now() WHERE id = $2 RETURNING *`,
    [adminAction, caseId]
  );
  return result.rows[0];
};

export const setUserBanStatus = async (userId, { banStatus, banReason, bannedUntil = null }) => {
  await pool.query(
    `UPDATE users SET ban_status = $1, ban_reason = $2, banned_until = $3 WHERE id = $4`,
    [banStatus, banReason, bannedUntil, userId]
  );
};
// Admin-dashboard ke liye — case + message-content + reported-user-details sab-ek-saath
export const findPendingCasesWithDetails = async () => {
  const result = await pool.query(
    `SELECT mc.*,
            cm.content AS message_content,
            u.email AS reported_user_email,
            p.full_name AS reported_user_name
     FROM moderation_cases mc
     JOIN consultation_messages cm ON cm.id = mc.message_id
     JOIN users u ON u.id = mc.reported_user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE mc.status = 'pending'
     ORDER BY mc.created_at ASC`
  );
  return result.rows;
};
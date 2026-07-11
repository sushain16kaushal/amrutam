import pool from '../../config/db.js';

export const listLogs = async ({ actorId, action, fromDate, toDate, page = 1, limit = 20 }) => {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (actorId) { conditions.push(`actor_id = $${idx++}`); values.push(actorId); }
  if (action) { conditions.push(`action = $${idx++}`); values.push(action); }
  if (fromDate) { conditions.push(`created_at >= $${idx++}`); values.push(fromDate); }
  if (toDate) { conditions.push(`created_at <= $${idx++}`); values.push(toDate); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  values.push(limit, offset);

  const result = await pool.query(
    `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    values
  );
  return result.rows;
};
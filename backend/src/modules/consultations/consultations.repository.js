import pool from '../../config/db.js';

export const updateStatus = async (client, consultationId, status) => {
  const result = await client.query(
    `UPDATE consultations SET status = $1 WHERE id = $2 RETURNING *`,
    [status, consultationId]
  );
  return result.rows[0];
};

export const findByPatientId = async (patientId) => {
  const result = await pool.query(
    `SELECT c.id, c.status, c.created_at,
            s.start_time, s.end_time,
            d.id AS doctor_id, d.specialty, p.full_name AS doctor_name
     FROM consultations c
     JOIN availability_slots s ON c.slot_id = s.id
     JOIN doctors d ON s.doctor_id = d.id
     JOIN profiles p ON p.user_id = d.user_id
     WHERE c.patient_id = $1
       AND c.hidden_by_patient = false
     ORDER BY s.start_time DESC`,
    [patientId]
  );
  return result.rows;
};

export const hideByPatientId = async (consultationId, patientId) => {
  const result = await pool.query(
    `UPDATE consultations
     SET hidden_by_patient = true
     WHERE id = $1 AND patient_id = $2
     RETURNING *`,
    [consultationId, patientId]
  );
  return result.rows[0];
};

export const findByDoctorUserId = async (doctorUserId) => {
  const result = await pool.query(
    `SELECT c.id, c.status, c.created_at,
            s.start_time, s.end_time,
            p.full_name AS patient_name, c.patient_id
     FROM consultations c
     JOIN availability_slots s ON c.slot_id = s.id
     JOIN doctors d ON s.doctor_id = d.id
     JOIN profiles p ON p.user_id = c.patient_id
     WHERE d.user_id = $1
     ORDER BY s.start_time DESC`,
    [doctorUserId]
  );
  return result.rows;
};
export const findSpecialtyByConsultationId = async (consultationId) => {
  const result = await pool.query(
    `SELECT d.specialty
     FROM consultations c
     JOIN availability_slots s ON s.id = c.slot_id
     JOIN doctors d ON d.id = s.doctor_id
     WHERE c.id = $1`,
    [consultationId]
  );
  return result.rows[0]?.specialty || null;
};

export const findAiDoctorContextByConsultationId = async (consultationId) => {
  const result = await pool.query(
    `SELECT d.specialty, d.ai_persona_config, d.user_id AS doctor_user_id, c.patient_id
     FROM consultations c
     JOIN availability_slots s ON s.id = c.slot_id
     JOIN doctors d ON d.id = s.doctor_id
     WHERE c.id = $1`,
    [consultationId]
  );
  return result.rows[0] || null;
};
export const findConsultationWithParties = async (consultationId) => {
  const result = await pool.query(
    `SELECT c.*, s.doctor_id, d.user_id AS doctor_user_id, s.id AS slot_id, d.doctor_kind,
            s.start_time, s.end_time
     FROM consultations c
     JOIN availability_slots s ON c.slot_id = s.id
     JOIN doctors d ON s.doctor_id = d.id
     WHERE c.id = $1`,
    [consultationId]
  );
  return result.rows[0] || null;
};
export const findExpiredActiveConsultations = async () => {
  const result = await pool.query(
    `SELECT c.id, c.status
     FROM consultations c
     JOIN availability_slots s ON c.slot_id = s.id
     WHERE c.status IN ('confirmed', 'in_progress')
       AND s.end_time < now()`
  );
  return result.rows;
};

// NEW — consultation-end pe generate hui health report yahan save hoti hai
export const saveHealthReport = async (consultationId, reportJson, clinicsJson) => {
  const result = await pool.query(
    `UPDATE consultations
     SET health_report_json = $1,
         health_report_clinics = $2,
         health_report_generated_at = now()
     WHERE id = $3
     RETURNING *`,
    [reportJson, clinicsJson, consultationId]
  );
  return result.rows[0];
};

// NEW — patient/doctor apni consultation ki final report fetch kar sake, isliye
export const findHealthReportByConsultationId = async (consultationId) => {
  const result = await pool.query(
    `SELECT health_report_json, health_report_clinics, health_report_generated_at
     FROM consultations WHERE id = $1`,
    [consultationId]
  );
  return result.rows[0] || null;
};

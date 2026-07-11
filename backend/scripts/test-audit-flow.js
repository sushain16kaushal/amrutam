// scripts/test-audit-flow.js
import crypto from 'crypto';

const AUTH_BASE_URL = 'http://localhost:5000/api/auth';
const DOCTORS_BASE_URL = 'http://localhost:5000/api/doctors';
const BOOKINGS_BASE_URL = 'http://localhost:5000/api/bookings';
const CONSULT_BASE_URL = 'http://localhost:5000/api/consultations';
const AUDIT_BASE_URL = 'http://localhost:5000/api/audit-logs';

const log = (label, data) => {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
};

const register = async (role, email, password = 'Test@1234') => {
  await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });
};

const login = async (email, password = 'Test@1234') => {
  const res = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return (await res.json()).data;
};

const registerAndLogin = async (role) => {
  const email = `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@amrutam.com`;
  await register(role, email);
  const loginData = await login(email);
  return { email, token: loginData.accessToken, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginData.accessToken}` } };
};

const run = async () => {
  // --- Setup: admin, doctor, patient ---
  const admin = await registerAndLogin('admin');
  const doctor = await registerAndLogin('doctor');
  const patient = await registerAndLogin('patient');

  await fetch(`${DOCTORS_BASE_URL}/register`, {
    method: 'POST', headers: doctor.headers,
    body: JSON.stringify({ specialty: 'General Medicine' })
  });
  // verify the doctor so booking/search would work if needed
  console.log('\n(Note: doctor is unverified by default — not required for this audit test since we book directly by slot id)');

  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
  const slotRes = await fetch(`${DOCTORS_BASE_URL}/availability`, {
    method: 'POST', headers: doctor.headers,
    body: JSON.stringify({ startTime: startTime.toISOString(), endTime: endTime.toISOString() })
  });
  const slot = (await slotRes.json()).data;

  // --- 1. Patient tries to read audit logs — expect 403 (RBAC check) ---
  const patientAuditRes = await fetch(AUDIT_BASE_URL, { headers: patient.headers });
  log('1. Patient reads audit logs (expect 403)', await patientAuditRes.json());

  // --- 2. Admin reads audit logs — expect success, should already contain login_success entries ---
  const adminAuditRes1 = await fetch(AUDIT_BASE_URL, { headers: admin.headers });
  const adminAuditData1 = await adminAuditRes1.json();
  console.log(`\n--- 2. Admin reads audit logs (expect success, some entries) ---`);
  console.log(`Total entries so far: ${adminAuditData1.data.length}`);
  console.log('Sample actions:', adminAuditData1.data.slice(0, 5).map((l) => l.action));

  // --- 3. Trigger a failed login (wrong password) and confirm it gets logged ---
  const failedLoginRes = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: patient.email, password: 'WrongPassword!' })
  });
  log('3. Failed login attempt (expect 401)', await failedLoginRes.json());

  const failedLoginAuditRes = await fetch(`${AUDIT_BASE_URL}?action=login_failed&limit=5`, { headers: admin.headers });
  const failedLoginAuditData = await failedLoginAuditRes.json();
  log('4. Filter audit logs by action=login_failed (expect at least 1)', failedLoginAuditData);

  // --- 5. Book a slot, confirm 'booking_created' gets logged ---
  const bookRes = await fetch(BOOKINGS_BASE_URL, {
    method: 'POST',
    headers: { ...patient.headers, 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({ slotId: slot.id })
  });
  const bookData = await bookRes.json();
  console.log('\n--- 5. Booking created ---');
  console.log('Consultation ID:', bookData.data?.id);

  const bookingAuditRes = await fetch(`${AUDIT_BASE_URL}?action=booking_created&limit=5`, { headers: admin.headers });
  const bookingAuditData = await bookingAuditRes.json();
  log('6. Filter audit logs by action=booking_created', bookingAuditData);
  const found = bookingAuditData.data.find((l) => l.metadata?.consultationId === bookData.data?.id);
  console.log(found
    ? '✅ Booking action correctly logged with matching consultationId'
    : '❌ Booking audit entry not found');

  // --- 7. Cancel it, confirm 'consultation_cancelled' gets logged ---
  const cancelRes = await fetch(`${CONSULT_BASE_URL}/${bookData.data.id}/cancel`, {
    method: 'POST', headers: patient.headers
  });
  console.log('\n--- 7. Cancellation ---');
  console.log(await cancelRes.json());

  const cancelAuditRes = await fetch(`${AUDIT_BASE_URL}?action=consultation_cancelled&limit=5`, { headers: admin.headers });
  const cancelAuditData = await cancelAuditRes.json();
  log('8. Filter audit logs by action=consultation_cancelled', cancelAuditData);

  // --- 9. Filter by actorId — should only return this patient's actions ---
  // need the patient's user id — decode it from the JWT payload (base64, no verification needed for a test script)
  const payload = JSON.parse(Buffer.from(patient.token.split('.')[1], 'base64').toString());
  const actorAuditRes = await fetch(`${AUDIT_BASE_URL}?actorId=${payload.id}&limit=10`, { headers: admin.headers });
  const actorAuditData = await actorAuditRes.json();
  log(`9. Filter audit logs by actorId=${payload.id}`, actorAuditData);
  const allMatch = actorAuditData.data.every((l) => l.actor_id === payload.id);
  console.log(allMatch
    ? '✅ actorId filter working correctly — all entries belong to this patient'
    : '❌ actorId filter returned entries from other users');
};

run().catch(console.error);
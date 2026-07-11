// test-consultation-flow.js
import crypto from 'crypto';

const AUTH_BASE_URL = 'http://localhost:5000/api/auth';
const DOCTORS_BASE_URL = 'http://localhost:5000/api/doctors';
const BOOKINGS_BASE_URL = 'http://localhost:5000/api/bookings';
const CONSULT_BASE_URL = 'http://localhost:5000/api/consultations';

const log = (label, data) => {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
};

const registerAndLogin = async (role) => {
  const email = `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@amrutam.com`;
  await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test@1234', role })
  });
  const loginRes = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test@1234' })
  });
  const loginData = await loginRes.json();
  return loginData.data.accessToken;
};

const createSlot = async (doctorHeaders, hoursFromNow) => {
  const startTime = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
  const res = await fetch(`${DOCTORS_BASE_URL}/availability`, {
    method: 'POST', headers: doctorHeaders,
    body: JSON.stringify({ startTime: startTime.toISOString(), endTime: endTime.toISOString() })
  });
  return (await res.json()).data;
};

const bookSlot = async (patientHeaders, slotId) => {
  const res = await fetch(BOOKINGS_BASE_URL, {
    method: 'POST',
    headers: { ...patientHeaders, 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({ slotId })
  });
  return (await res.json()).data;
};

const run = async () => {
  // --- Setup ---
  const doctorToken = await registerAndLogin('doctor');
  const doctorHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` };
  await fetch(`${DOCTORS_BASE_URL}/register`, {
    method: 'POST', headers: doctorHeaders,
    body: JSON.stringify({ specialty: 'Dermatology' })
  });

  const patientToken = await registerAndLogin('patient');
  const patientHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` };

  const otherPatientToken = await registerAndLogin('patient');
  const otherPatientHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${otherPatientToken}` };

  // ============ FLOW A: happy path — in_progress -> prescription -> completed ============
  const slotA = await createSlot(doctorHeaders, 24);
  const consultationA = await bookSlot(patientHeaders, slotA.id);
  console.log(`\nFlow A setup: consultation ${consultationA.id}, status = ${consultationA.status}`);

  // 1. Random other patient tries to view it — expect 403
  const viewByOutsiderRes = await fetch(`${CONSULT_BASE_URL}/${consultationA.id}`, {
    headers: otherPatientHeaders
  });
  log('1. Outsider patient views consultation (expect 403)', await viewByOutsiderRes.json());

  // 2. Patient tries to mark it in_progress — expect 403 (only doctor can)
  const patientTriesUpdateRes = await fetch(`${CONSULT_BASE_URL}/${consultationA.id}/status`, {
    method: 'PATCH', headers: patientHeaders,
    body: JSON.stringify({ status: 'in_progress' })
  });
  log('2. Patient tries to update status (expect 403)', await patientTriesUpdateRes.json());

  // 3. Doctor tries to prescribe before consultation started — expect 400
  const earlyPrescribeRes = await fetch(`${CONSULT_BASE_URL}/${consultationA.id}/prescriptions`, {
    method: 'POST', headers: doctorHeaders,
    body: JSON.stringify({ details: 'Too early' })
  });
  log('3. Doctor prescribes while still "confirmed" (expect 400)', await earlyPrescribeRes.json());

  // 4. Doctor marks in_progress — expect success
  const inProgressRes = await fetch(`${CONSULT_BASE_URL}/${consultationA.id}/status`, {
    method: 'PATCH', headers: doctorHeaders,
    body: JSON.stringify({ status: 'in_progress' })
  });
  log('4. Doctor marks in_progress (expect success)', await inProgressRes.json());

  // 5. Doctor writes prescription — expect success
  const prescribeRes = await fetch(`${CONSULT_BASE_URL}/${consultationA.id}/prescriptions`, {
    method: 'POST', headers: doctorHeaders,
    body: JSON.stringify({ details: 'Paracetamol 500mg, twice daily for 3 days' })
  });
  const prescribeData = await prescribeRes.json();
  log('5. Doctor writes prescription (expect success)', prescribeData);

  // 6. Patient reads prescription — expect success (patient is a party)
  const readPrescriptionRes = await fetch(`${CONSULT_BASE_URL}/${consultationA.id}/prescriptions`, {
    headers: patientHeaders
  });
  log('6. Patient reads prescriptions (expect the one prescription)', await readPrescriptionRes.json());

  // 7. Doctor marks completed — expect success
  const completedRes = await fetch(`${CONSULT_BASE_URL}/${consultationA.id}/status`, {
    method: 'PATCH', headers: doctorHeaders,
    body: JSON.stringify({ status: 'completed' })
  });
  log('7. Doctor marks completed (expect success)', await completedRes.json());

  // 8. Doctor tries an illegal transition (completed -> in_progress) — expect 400
  const illegalTransitionRes = await fetch(`${CONSULT_BASE_URL}/${consultationA.id}/status`, {
    method: 'PATCH', headers: doctorHeaders,
    body: JSON.stringify({ status: 'in_progress' })
  });
  log('8. Illegal transition completed -> in_progress (expect 400)', await illegalTransitionRes.json());

  // ============ FLOW B: cancellation — slot should reopen ============
  const slotB = await createSlot(doctorHeaders, 48);
  const consultationB = await bookSlot(patientHeaders, slotB.id);
  console.log(`\nFlow B setup: consultation ${consultationB.id}, slot ${slotB.id}`);

  // 9. Patient cancels their own confirmed consultation — expect success
  const cancelRes = await fetch(`${CONSULT_BASE_URL}/${consultationB.id}/cancel`, {
    method: 'POST', headers: patientHeaders
  });
  log('9. Patient cancels confirmed consultation (expect success)', await cancelRes.json());

  // 10. Verify slot B is open again
  const doctorProfileRes = await fetch(`${DOCTORS_BASE_URL}/register`, {
    method: 'POST', headers: doctorHeaders, body: JSON.stringify({ specialty: 'x' })
  }); // will 409 since already registered, but we just need doctor.id — fetch it differently below
  const slotsListRes = await fetch(`${DOCTORS_BASE_URL}/${slotB.doctor_id}/availability`);
  const slotsListData = await slotsListRes.json();
  const reopenedSlot = slotsListData.data.find((s) => s.id === slotB.id);
  log('10. Slot B status after cancellation (expect open)', reopenedSlot);
  console.log(reopenedSlot?.status === 'open'
    ? '✅ Cancellation reopened the slot correctly'
    : '❌ Slot did not reopen after cancellation');

  // 11. Try to cancel an already-cancelled consultation — expect 400
  const doubleCancelRes = await fetch(`${CONSULT_BASE_URL}/${consultationB.id}/cancel`, {
    method: 'POST', headers: patientHeaders
  });
  log('11. Cancel an already-cancelled consultation (expect 400)', await doubleCancelRes.json());
};

run().catch(console.error);
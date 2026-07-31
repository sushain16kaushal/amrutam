import crypto from 'crypto';

const AUTH_BASE_URL = 'http://localhost:5000/api/auth';
const DOCTORS_BASE_URL = 'http://localhost:5000/api/doctors';
const BOOKINGS_BASE_URL = 'http://localhost:5000/api/bookings';

const log = (label, data) => {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
};

const registerAndLogin = async (role) => {
  const email = `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@amrutam.com`;
  await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test@1234', role, country: 'IN', city: 'Gurugram' })
  });
  const loginRes = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test@1234' })
  });
  const loginData = await loginRes.json();
  return loginData.data.accessToken;
};

const run = async () => {
  // Setup: ek doctor banao aur ek slot add karo
  const doctorToken = await registerAndLogin('doctor');
  const doctorHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` };

  const doctorProfileRes = await fetch(`${DOCTORS_BASE_URL}/register`, {
    method: 'POST', headers: doctorHeaders,
    body: JSON.stringify({ specialty: 'Cardiology' })
  });
  const doctorProfile = (await doctorProfileRes.json()).data;

  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
  const slotRes = await fetch(`${DOCTORS_BASE_URL}/availability`, {
    method: 'POST', headers: doctorHeaders,
    body: JSON.stringify({ startTime: startTime.toISOString(), endTime: endTime.toISOString() })
  });
  const slot = (await slotRes.json()).data;
  console.log(`Setup done: doctor ${doctorProfile.id}, slot ${slot.id}`);

  // Ek patient banao
  const patientToken = await registerAndLogin('patient');
  const patientHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` };

  // 1. Booking WITHOUT Idempotency-Key header — expect 400
  const noKeyRes = await fetch(BOOKINGS_BASE_URL, {
    method: 'POST', headers: patientHeaders,
    body: JSON.stringify({ slotId: slot.id })
  });
  log('1. Book without Idempotency-Key (expect 400)', await noKeyRes.json());

  // 2. Successful booking
  const idempotencyKey = crypto.randomUUID();
  const bookRes = await fetch(BOOKINGS_BASE_URL, {
    method: 'POST',
    headers: { ...patientHeaders, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ slotId: slot.id })
  });
  const bookData = await bookRes.json();
  log('2. Book slot (success expected)', bookData);

  // 3. RETRY same request with SAME Idempotency-Key — should return cached response,
  //    NOT create a second consultation
  const retryRes = await fetch(BOOKINGS_BASE_URL, {
    method: 'POST',
    headers: { ...patientHeaders, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ slotId: slot.id })
  });
  const retryData = await retryRes.json();
  log('3. Retry with SAME Idempotency-Key (expect identical response, no duplicate)', retryData);
  console.log(retryData.data?.id === bookData.data?.id
    ? '✅ Idempotency working — same consultation ID returned'
    : '❌ Idempotency broken — different result on retry');

  // 4. Different patient tries to book the SAME slot (already booked) — expect 409
  const patient2Token = await registerAndLogin('patient');
  const bookAgainRes = await fetch(BOOKINGS_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patient2Token}`,
      'Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify({ slotId: slot.id })
  });
  log('4. Second patient books same (already-booked) slot (expect 409)', await bookAgainRes.json());

  // 5. Payment failure rollback demo — new slot, forced failure
  const startTime2 = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const endTime2 = new Date(startTime2.getTime() + 30 * 60 * 1000);
  const slot2Res = await fetch(`${DOCTORS_BASE_URL}/availability`, {
    method: 'POST', headers: doctorHeaders,
    body: JSON.stringify({ startTime: startTime2.toISOString(), endTime: endTime2.toISOString() })
  });
  const slot2 = (await slot2Res.json()).data;

  const failRes = await fetch(BOOKINGS_BASE_URL, {
    method: 'POST',
    headers: { ...patientHeaders, 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({ slotId: slot2.id, simulateFailure: true })
  });
  log('5. Booking with simulated payment failure (expect 402, rollback)', await failRes.json());

  // 6. Verify slot2 is still 'open' after the rollback (booking should NOT have stuck)
  const slot2CheckRes = await fetch(`${DOCTORS_BASE_URL}/${doctorProfile.id}/availability`);
  const slot2CheckData = await slot2CheckRes.json();
  const stillOpen = slot2CheckData.data.find((s) => s.id === slot2.id);
  log('6. Slot status after rollback (expect status: open)', stillOpen);
  console.log(stillOpen?.status === 'open'
    ? '✅ Rollback worked — slot is still open after payment failure'
    : '❌ Rollback failed — slot was incorrectly marked booked');
};

run().catch(console.error);

const AUTH_BASE_URL = 'http://localhost:5000/api/auth';
const DOCTORS_BASE_URL = 'http://localhost:5000/api/doctors';
const TEST_EMAIL = `doctor_${Date.now()}@amrutam.com`; // har run pe unique email
const TEST_PASSWORD = 'Test@1234';

const log = (label, data) => {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
};

const run = async () => {
  // 1. Register a doctor-role user
  const registerRes = await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, role: 'doctor' })
  });
  const registerData = await registerRes.json();
  log('1. Register (role: doctor)', registerData);
  if (!registerData.success) return console.error('Register failed, stopping.');

  // 2. Login (MFA not enabled for this test user, so accessToken comes back directly)
  const loginRes = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });
  const loginData = await loginRes.json();
  log('2. Login', loginData);
  const accessToken = loginData.data.accessToken;
  if (!accessToken) return console.error('No accessToken returned, stopping. (Did this account have MFA enabled from a previous run? Use a fresh email.)');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`
  };

  // 3. Register doctor profile
  const registerDoctorRes = await fetch(`${DOCTORS_BASE_URL}/register`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ specialty: 'Cardiology' })
  });
  const registerDoctorData = await registerDoctorRes.json();
  log('3. Register doctor profile', registerDoctorData);
  if (!registerDoctorData.success) return console.error('Doctor profile creation failed, stopping.');
  const doctorId = registerDoctorData.data.id;

  // 4. Add an availability slot (must be in the future)
  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // +30 min

  const addSlotRes = await fetch(`${DOCTORS_BASE_URL}/availability`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ startTime: startTime.toISOString(), endTime: endTime.toISOString() })
  });
  const addSlotData = await addSlotRes.json();
  log('4. Add availability slot', addSlotData);
  if (!addSlotData.success) return console.error('Slot creation failed, stopping.');

  // 5. List availability for this doctor (public route, no auth header needed —
  //    but sending it anyway doesn't hurt, since the route ignores it)
  const listRes = await fetch(`${DOCTORS_BASE_URL}/${doctorId}/availability`);
  const listData = await listRes.json();
  log('5. List doctor availability', listData);

  if (listData.success && listData.data.length > 0) {
    console.log('\n✅ DOCTORS MODULE FLOW WORKING END TO END');
  } else {
    console.log('\n❌ Something failed — check the step above');
  }

  // 6. Bonus sanity check: duplicate doctor registration should fail with 409
  const dupRes = await fetch(`${DOCTORS_BASE_URL}/register`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ specialty: 'Dermatology' })
  });
  const dupData = await dupRes.json();
  log('6. Duplicate doctor registration (expect 409)', dupData);

  // 7. Bonus sanity check: past-dated slot should be rejected with 400
  const pastSlotRes = await fetch(`${DOCTORS_BASE_URL}/availability`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1hr ago
      endTime: new Date().toISOString()
    })
  });
  const pastSlotData = await pastSlotRes.json();
  log('7. Past-dated slot (expect 400)', pastSlotData);
};

run().catch(console.error);
